#!/usr/bin/env bash
# Records the footage for this video: the terminal tapes with VHS, the console
# parts with Playwright, in the tutorial's order. See recording.md.
#
#   ./record.sh              every chapter: 02 to 11, then 00
#   ./record.sh 08 09 10     only these chapters, in the order given
#
# Before running, set KUBECONFIG (cluster-admin) and, for the chapters that
# need them:
#   VAULT_LICENSE_FILE                               chapter 03
#   OCP_CONSOLE_USER and OCP_CONSOLE_PASSWORD_FILE   chapters 02, 05, 08, 09
#   (or OCP_CONSOLE_STATE, a saved Playwright session, for SSO clusters)
#
# Output in clips/: an MP4 per clip, timeline.csv (chapter, clip, start, end,
# in Unix seconds) and marks.csv (clip, label, seconds into the clip).
#
# Uses vhs and ffmpeg when installed; otherwise the VHS container image, which
# has both. The container gets Linux oc and helm, downloaded to .tools/.
set -Eeuo pipefail
cd "$(dirname "$0")"

VHS_IMAGE=ghcr.io/charmbracelet/vhs:v0.10.0
HELM_VERSION=v3.16.4
OC_CHANNEL=stable-4.22

ALL=(02 03 04 05 06 07 08 09 10 11 00)
if (( $# )); then CHAPTERS=("$@"); else CHAPTERS=("${ALL[@]}"); fi

# What each chapter records, in order. browser:NAME runs browser/NAME.mjs,
# tape:NAME runs tapes/NAME.tape, split:B+T runs browser B and tape T at once.
steps() {
  case $1 in
    02) echo browser:02-install-mto tape:02-install-mto ;;
    03) echo tape:03-vault ;;
    04) echo tape:04-vco ;;
    05) echo browser:05-eso tape:05-eso-reloader browser:05-reloader-console ;;
    06) echo tape:06-vault-login ;;
    07) echo tape:07-extension ;;
    08) echo split:08-vault-split+08-tenants browser:08-consoles ;;
    09) echo tape:09-app browser:09-app ;;
    10) echo tape:10-rotate browser:10-rotate ;;
    11) echo tape:11-isolation ;;
    00) echo browser:00-cold-open ;;
    *) return 1 ;;
  esac
}

die() { echo "record.sh: $*" >&2; exit 1; }
now() { perl -MTime::HiRes=time -e 'printf "%.3f\n", time'; }

chapter=- step=-
trap 'echo "record.sh: chapter $chapter failed at $step" >&2' ERR

# --- Checks, before anything is recorded --------------------------------------

[[ -n ${KUBECONFIG:-} && -r $KUBECONFIG ]] || die "set KUBECONFIG to a readable kubeconfig"
oc whoami >/dev/null || die "oc can't reach the cluster with KUBECONFIG"
[[ -d node_modules/playwright ]] || die "run: npm install && npx playwright install chromium"
for c in "${CHAPTERS[@]}"; do
  steps "$c" >/dev/null || die "no chapter $c; chapters are ${ALL[*]}"
  case $c in
    03) [[ -r ${VAULT_LICENSE_FILE:-} ]] || die "chapter 03 needs VAULT_LICENSE_FILE" ;;
    02|05|08|09)
      [[ -r ${OCP_CONSOLE_STATE:-} || ( -n ${OCP_CONSOLE_USER:-} && -r ${OCP_CONSOLE_PASSWORD_FILE:-} ) ]] ||
        die "chapter $c signs in to the OpenShift console: set OCP_CONSOLE_USER and OCP_CONSOLE_PASSWORD_FILE, or OCP_CONSOLE_STATE" ;;
  esac
done

# A saved console session ends with its SSO session: check it before recording.
if [[ -n ${OCP_CONSOLE_STATE:-} ]]; then
  for c in "${CHAPTERS[@]}"; do
    case $c in
      02|05|08|09) node browser/console-session.mjs --check || exit 1; break ;;
    esac
  done
fi

mkdir -p clips
echo "chapter,clip,start,end" > clips/timeline.csv
: > clips/marks.csv

# --- VHS and ffmpeg: local, or in a container ---------------------------------

# Docker Desktop can't mount every folder (on macOS, not ~/Documents), so
# whatever the container needs is copied to a private folder under /tmp,
# which is removed at the end.
STAGE=
stage() {
  [[ -n $STAGE ]] && return
  command -v docker >/dev/null || die "install vhs and ffmpeg, or Docker"
  STAGE=$(cd "$(mktemp -d /tmp/record-post2.XXXXXX)" && pwd -P)
  trap 'rm -rf "$STAGE"' EXIT
}

VHS_IN_DOCKER=
if ! command -v vhs >/dev/null; then
  VHS_IN_DOCKER=1
  stage
  arch=$(docker info --format '{{.Architecture}}')
  case $arch in
    aarch64|arm64) ocarch=aarch64 goarch=arm64 ;;
    x86_64|amd64) ocarch=x86_64 goarch=amd64 ;;
    *) die "no Linux oc and helm for $arch" ;;
  esac
  TOOLS=$PWD/.tools/linux-$goarch
  if [[ ! -x $TOOLS/oc || ! -x $TOOLS/helm ]]; then
    echo "record.sh: downloading Linux oc and helm for the VHS container"
    mkdir -p "$TOOLS"
    curl -fsSL "https://mirror.openshift.com/pub/openshift-v4/$ocarch/clients/ocp/$OC_CHANNEL/openshift-client-linux.tar.gz" |
      tar -xz -C "$TOOLS" oc
    curl -fsSL "https://get.helm.sh/helm-$HELM_VERSION-linux-$goarch.tar.gz" |
      tar -xz -C "$TOOLS" --strip-components 1 "linux-$goarch/helm"
  fi
  # The tutorial (tapes and examples), the tools, and the secrets beside them.
  rsync -a --exclude node_modules --exclude clips --exclude .tools ../ "$STAGE/post/"
  mkdir -p "$STAGE/post/video/clips" "$STAGE/tools" "$STAGE/secrets"
  cp "$TOOLS/oc" "$TOOLS/helm" "$STAGE/tools/"
  cp "$KUBECONFIG" "$STAGE/secrets/kubeconfig"
  if [[ -n ${VAULT_LICENSE_FILE:-} ]]; then cp "$VAULT_LICENSE_FILE" "$STAGE/secrets/vault.hclic"; fi
fi

# Passes VHS's output through, and stamps when the recording ends: VHS prints
# "Creating <clip>..." when it starts to encode.
stamp_end() {
  local line
  while IFS= read -r line; do
    printf '%s\n' "$line"
    if [[ $line == Creating* ]]; then now > "clips/.$1.end"; fi
  done
}

# The clip a tape writes, from its Output line, without clips/ and .mp4.
tape_clip() { awk '/^Output /{ sub("clips/", "", $2); sub(/\.mp4$/, "", $2); print $2 }' "tapes/$1.tape"; }

run_tape() {
  local clip; clip=$(tape_clip "$1")
  step="tapes/$1.tape"
  echo "record.sh: chapter $chapter, tape $1"
  local t0; t0=$(now)
  if [[ -z $VHS_IN_DOCKER ]]; then
    CLIP=$clip vhs "tapes/$1.tape" 2>&1 | stamp_end "$clip"
  else
    docker run --rm -e CLIP="$clip" \
      -v "$STAGE/post:/work" -w /work/video \
      -v "$STAGE/tools/oc:/usr/local/bin/oc:ro" -v "$STAGE/tools/helm:/usr/local/bin/helm:ro" \
      -v "$STAGE/secrets:/secrets:ro" -e KUBECONFIG=/secrets/kubeconfig -e VAULT_LICENSE_FILE=/secrets/vault.hclic \
      "$VHS_IMAGE" "tapes/$1.tape" 2>&1 | stamp_end "$clip"
    mv "$STAGE/post/video/clips/$clip.mp4" "$STAGE/post/video/clips/.$clip.start" clips/
  fi
  timeline "$clip" "$t0"
}

run_browser() {
  step="browser/$1.mjs"
  echo "record.sh: chapter $chapter, browser $1"
  local t0; t0=$(now)
  node "browser/$1.mjs"
  timeline "$1" "$t0"
}

# The split screen in chapter 8: the browser first, and the tape once the
# browser is recording with the namespace picker open. The browser stops by
# itself once the namespaces appear.
run_split() {
  local browser=${1%+*} tape=${1#*+}
  step="browser/$browser.mjs"
  echo "record.sh: chapter $chapter, split screen: browser $browser with tape $tape"
  local t0; t0=$(now)
  node "browser/$browser.mjs" & local pid=$!
  local waited=0
  until grep -q "^$browser,picker open," clips/marks.csv 2>/dev/null; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid" || die "chapter $chapter failed at $step"
      die "chapter $chapter: browser $browser ended before it opened the namespace picker"
    fi
    if (( ++waited > 180 )); then
      kill "$pid"
      die "chapter $chapter: browser $browser didn't open the namespace picker in 3 minutes"
    fi
    sleep 1
  done
  run_tape "$tape"
  step="browser/$browser.mjs"
  wait "$pid"
  timeline "$browser" "$t0"
}

# One timeline row, in Unix seconds: when the clip's visible part began and
# ended, stamped by the clip itself (clips/.CLIP.start and .end), else when
# its process started and ended.
timeline() {
  local start=$2 end
  end=$(now)
  if [[ -s clips/.$1.start ]]; then start=$(<"clips/.$1.start"); fi
  if [[ -s clips/.$1.end ]]; then end=$(<"clips/.$1.end"); fi
  echo "$chapter,$1,$start,$end" >> clips/timeline.csv
  rm -f "clips/.$1.start" "clips/.$1.end"
}

# --- Record ---------------------------------------------------------------------

for chapter in "${CHAPTERS[@]}"; do
  for s in $(steps "$chapter"); do
    case $s in
      tape:*) run_tape "${s#tape:}" ;;
      browser:*) run_browser "${s#browser:}" ;;
      split:*) run_split "${s#split:}" ;;
    esac
  done
done

# --- Browser clips to MP4 ----------------------------------------------------

chapter=- step="converting the browser clips to MP4"
shopt -s nullglob
webms=(clips/*.webm)
if (( ${#webms[@]} )); then
  echo "record.sh: converting ${#webms[@]} browser clips to MP4"
  if command -v ffmpeg >/dev/null; then
    for w in "${webms[@]}"; do
      ffmpeg -loglevel error -y -i "$w" -c:v libx264 -pix_fmt yuv420p "${w%.webm}.mp4" && rm "$w"
    done
  else
    stage
    mkdir -p "$STAGE/convert"
    mv "${webms[@]}" "$STAGE/convert/"
    docker run --rm -v "$STAGE/convert:/c" -w /c --entrypoint sh "$VHS_IMAGE" -c \
      'for w in *.webm; do ffmpeg -loglevel error -y -i "$w" -c:v libx264 -pix_fmt yuv420p "${w%.webm}.mp4"; done'
    mv "$STAGE/convert/"*.mp4 clips/
  fi
fi
rmdir clips/raw 2>/dev/null || true

echo "record.sh: done. Clips, timeline.csv and marks.csv are in clips/"
