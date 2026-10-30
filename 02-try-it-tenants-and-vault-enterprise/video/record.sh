#!/usr/bin/env bash
# Records the footage for this video, beat by beat, per recording.md's scene
# table. See recording.md.
#
#   ./record.sh              every beat, then the cold open
#   ./record.sh 08a 08b      only these beats
#   ./record.sh 08a-10c      a range, in table order
#
# Before running, set KUBECONFIG (cluster-admin), VAULT_LICENSE_FILE, and
# OCP_CONSOLE_STATE (a saved console session, from browser/console-session.mjs)
# or OCP_CONSOLE_USER with OCP_CONSOLE_PASSWORD_FILE.
#
# The terminal pane is a ttyd terminal, served from VHS's container image with
# Linux oc and helm (downloaded to .tools/) and the kubeconfig and license
# mounted; Playwright records it and the console on one clock. Output in
# clips/: a clip per pane (MP4), timeline.csv and marks.csv.
set -Eeuo pipefail
cd "$(dirname "$0")"

IMAGE=ghcr.io/charmbracelet/vhs:v0.10.0
HELM_VERSION=v3.16.4
OC_CHANNEL=stable-4.22
PORT=7681
NAME=post2-ttyd
DRACULA='{"background":"#282a36","foreground":"#f8f8f2","cursor":"#f8f8f2","selectionBackground":"#44475a","black":"#21222c","red":"#ff5555","green":"#50fa7b","yellow":"#f1fa8c","blue":"#bd93f9","magenta":"#ff79c6","cyan":"#8be9fd","white":"#f8f8f2","brightBlack":"#6272a4","brightRed":"#ff6e6e","brightGreen":"#69ff94","brightYellow":"#ffffa5","brightBlue":"#d6acff","brightMagenta":"#ff92df","brightCyan":"#a4ffff","brightWhite":"#ffffff"}'

die() { echo "record.sh: $*" >&2; exit 1; }

# --- Checks, before anything is recorded --------------------------------------

[[ -n ${KUBECONFIG:-} && -r $KUBECONFIG ]] || die "set KUBECONFIG to a readable kubeconfig"
oc whoami >/dev/null || die "oc can't reach the cluster with KUBECONFIG"
[[ -r ${VAULT_LICENSE_FILE:-} ]] || die "set VAULT_LICENSE_FILE (step 2 creates the license Secret from it, hidden)"
[[ -d node_modules/playwright ]] || die "run: npm install && npx playwright install chromium"
command -v docker >/dev/null || die "install Docker: the terminal runs in VHS's container image"
if [[ -n ${OCP_CONSOLE_STATE:-} ]]; then
  node browser/console-session.mjs --check || exit 1
fi

# --- The terminal server ---------------------------------------------------------

arch=$(docker info --format '{{.Architecture}}')
case $arch in
  aarch64|arm64) ocarch=aarch64 goarch=arm64 ;;
  x86_64|amd64) ocarch=x86_64 goarch=amd64 ;;
  *) die "no Linux oc and helm for $arch" ;;
esac
TOOLS=$PWD/.tools/linux-$goarch
if [[ ! -x $TOOLS/oc || ! -x $TOOLS/helm ]]; then
  echo "record.sh: downloading Linux oc and helm for the terminal"
  mkdir -p "$TOOLS"
  curl -fsSL "https://mirror.openshift.com/pub/openshift-v4/$ocarch/clients/ocp/$OC_CHANNEL/openshift-client-linux.tar.gz" | tar -xz -C "$TOOLS" oc
  curl -fsSL "https://get.helm.sh/helm-$HELM_VERSION-linux-$goarch.tar.gz" | tar -xz -C "$TOOLS" --strip-components 1 "linux-$goarch/helm"
fi

# Docker Desktop can't mount every folder (on macOS, not ~/Documents), so the
# tutorial, the tools and the secrets are copied to a private folder under
# /tmp, removed at the end with the container.
STAGE=$(cd "$(mktemp -d /tmp/record-post2.XXXXXX)" && pwd -P)
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; rm -rf "$STAGE"; }
trap cleanup EXIT
rsync -a --exclude node_modules --exclude clips --exclude .tools ../ "$STAGE/post/"
mkdir -p "$STAGE/tools" "$STAGE/secrets"
cp "$TOOLS/oc" "$TOOLS/helm" "$STAGE/tools/"
cp "$KUBECONFIG" "$STAGE/secrets/kubeconfig"
cp "$VAULT_LICENSE_FILE" "$STAGE/secrets/vault.hclic"

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p "127.0.0.1:$PORT:$PORT" \
  -v "$STAGE/post:/work" -w /work/video \
  -v "$STAGE/tools/oc:/usr/local/bin/oc:ro" -v "$STAGE/tools/helm:/usr/local/bin/helm:ro" \
  -v "$STAGE/secrets:/secrets" -e KUBECONFIG=/secrets/kubeconfig -e VAULT_LICENSE_FILE=/secrets/vault.hclic \
  --entrypoint ttyd "$IMAGE" -W -p "$PORT" \
  -t fontFamily=Menlo -t disableLeaveAlert=true -t "theme=$DRACULA" bash >/dev/null
until curl -fs "http://127.0.0.1:$PORT" >/dev/null; do sleep 1; done

# --- Record ----------------------------------------------------------------------

TTYD_URL="http://127.0.0.1:$PORT" node record.mjs "$@"

# --- Clips to MP4 ------------------------------------------------------------------

shopt -s nullglob
webms=(clips/*.webm)
if (( ${#webms[@]} )); then
  echo "record.sh: converting ${#webms[@]} clips to MP4"
  mkdir -p "$STAGE/convert"
  mv "${webms[@]}" "$STAGE/convert/"
  docker run --rm -v "$STAGE/convert:/c" -w /c --entrypoint sh "$IMAGE" -c \
    'for w in *.webm; do ffmpeg -loglevel error -y -i "$w" -c:v libx264 -pix_fmt yuv420p "${w%.webm}.mp4"; done'
  mv "$STAGE/convert/"*.mp4 clips/
fi
rmdir clips/raw 2>/dev/null || true
echo "record.sh: done. Clips, timeline.csv and marks.csv are in clips/"
