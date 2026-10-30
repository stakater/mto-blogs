#!/usr/bin/env python3
"""Assemble the three versions of the video from the recorded clips.

    python3 assemble.py            # all three versions, into out/
    python3 assemble.py demo       # one version: demo, walkthrough or short

Needs ffmpeg and Pillow. Each version is a list of segments: a card (an image
held for some seconds), a clip (a time range of one recorded clip, optionally
sped up), or a split screen (two clips side by side). Text is drawn as images
with Pillow and laid over the video, so any ffmpeg build works.

While the footage is a dry run and there is no voiceover, every frame carries
a "Draft preview" label (PREVIEW below), and chapters that were not recorded
yet are cards saying so. Edit the segment lists, not the code, to change a cut.
"""
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CLIPS = os.path.join(HERE, 'clips')
OUT = os.path.join(HERE, 'out')
LOGO = os.path.join(HERE, '..', '..', '..', 'mto-sales', 'public', 'stakater-logo.png')

W, H, FPS = 1920, 1080, 25
ORANGE = (234, 120, 69)
DARK_A, DARK_B = (10, 15, 28), (26, 26, 46)
WHITE = (255, 255, 255)
PREVIEW = 'Draft preview · dry-run footage · no voiceover'

SANS = '/System/Library/Fonts/SFNS.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'

TUTORIAL = 'github.com/stakater/mto-blogs · 02-try-it-tenants-and-vault-enterprise'
DOCS = 'docs.stakater.com/mto'

STEPS = {
    1: 'Install Multi-Tenant Operator',
    2: 'Install Vault Enterprise',
    3: 'Install Vault Config Operator',
    4: 'Install External Secrets Operator and Reloader',
    5: 'Give Vault Config Operator its login to Vault',
    6: 'Install the extension',
    7: 'Create two tenants',
    8: 'Deploy an app that reads its secret',
    9: 'Rotate the secret',
    10: 'Check the isolation',
}


def font(path, size):
    return ImageFont.truetype(path, size)


def gradient():
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(DARK_A, DARK_B)))
    return img


def wrap(d, text, f, width):
    lines, line = [], ''
    for word in text.split():
        test = (line + ' ' + word).strip()
        if d.textlength(test, font=f) <= width:
            line = test
        else:
            lines.append(line)
            line = word
    return lines + [line]


def card(path, title, sub=None, kicker=None, lines=None, logo=False):
    img = gradient()
    d = ImageDraw.Draw(img)
    y = 330
    if kicker:
        d.text((160, y), kicker.upper(), font=font(BOLD, 34), fill=ORANGE)
        y += 70
    for line in wrap(d, title, font(BOLD, 76), W - 320):
        d.text((160, y), line, font=font(BOLD, 76), fill=WHITE)
        y += 96
    if sub:
        y += 20
        for line in wrap(d, sub, font(SANS, 40), W - 320):
            d.text((160, y), line, font=font(SANS, 40), fill=(200, 205, 215))
            y += 56
    for line in lines or []:
        y += 14
        d.text((160, y), line, font=font(SANS, 40), fill=(220, 224, 232))
        y += 52
    if logo and os.path.exists(LOGO):
        lg = Image.open(LOGO).convert('RGBA')
        lg.thumbnail((420, 420))
        img.paste(lg, (W - 160 - lg.width, H - 120 - lg.height), lg)
    stamp(img)
    img.save(path)


def stamp(img):
    d = ImageDraw.Draw(img)
    f = font(SANS, 24)
    tw = d.textlength(PREVIEW, font=f)
    d.rounded_rectangle([W - tw - 60, 24, W - 24, 68], 10, fill=(0, 0, 0, 150))
    d.text((W - tw - 42, 32), PREVIEW, font=f, fill=(255, 255, 255, 230))


def overlay(path, label=None, speed=None, caption=None):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if label:
        f = font(BOLD, 30)
        tw = d.textlength(label, font=f)
        d.rounded_rectangle([24, H - 84, 24 + tw + 40, H - 30], 10, fill=ORANGE + (235,))
        d.text((44, H - 77), label, font=f, fill=WHITE)
    if speed:
        text = f'sped up {speed:g}×'
        f = font(BOLD, 30)
        tw = d.textlength(text, font=f)
        d.rounded_rectangle([W - tw - 64, 84, W - 24, 136], 10, fill=(0, 0, 0, 190))
        d.text((W - tw - 44, 92), text, font=f, fill=WHITE)
    if caption:
        f = font(BOLD, 48)
        lines = wrap(d, caption, f, W - 400)
        top = H - 140 - 64 * len(lines)
        width = max(d.textlength(l, font=f) for l in lines)
        d.rounded_rectangle([(W - width) / 2 - 30, top - 18, (W + width) / 2 + 30, top + 64 * len(lines) + 10], 14, fill=(0, 0, 0, 200))
        for i, l in enumerate(lines):
            d.text(((W - d.textlength(l, font=f)) / 2, top + 64 * i), l, font=f, fill=WHITE)
    stamp(img)
    img.save(path)


ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def render_card(seg, out, tmp):
    png = out + '.png'
    card(png, **seg['card'])
    ffmpeg('-loop', '1', '-t', str(seg['secs']), '-i', png, '-vf', f'fps={FPS},format=yuv420p', *ENC, out)


def render_clip(seg, out, tmp):
    png = out + '.png'
    overlay(png, seg.get('label'), seg.get('speed'), seg.get('caption'))
    speed = seg.get('speed') or 1
    src = os.path.join(CLIPS, seg['clip'] + '.mp4')
    ffmpeg('-ss', str(seg['start']), '-to', str(seg['end']), '-i', src, '-i', png,
           '-filter_complex', f'[0:v]setpts=PTS/{speed},fps={FPS},scale={W}:{H}[v];[v][1:v]overlay',
           *ENC, out)


def render_split(seg, out, tmp):
    png = out + '.png'
    overlay(png, seg.get('label'), None, seg.get('caption'))
    left, right = seg['left'], seg['right']
    dur = max(left[2] - left[1], right[2] - right[1])
    flt = (f'[0:v]setpts=PTS-STARTPTS,scale=940:-2,tpad=stop_mode=clone:stop_duration={dur}[l];'
           f'[1:v]setpts=PTS-STARTPTS,scale=940:-2,tpad=stop_mode=clone:stop_duration={dur}[r];'
           f'[l][r]hstack=inputs=2,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0x0A0F1C,trim=duration={dur},fps={FPS}[s];'
           f'[s][2:v]overlay')
    ffmpeg('-ss', str(left[1]), '-to', str(left[2]), '-i', os.path.join(CLIPS, left[0] + '.mp4'),
           '-ss', str(right[1]), '-to', str(right[2]), '-i', os.path.join(CLIPS, right[0] + '.mp4'),
           '-i', png, '-filter_complex', flt, *ENC, out)


def chapter(n):
    return {'card': {'title': STEPS[n], 'kicker': f'Step {n}'}, 'secs': 2.5}


def todo(n):
    return {'card': {'title': STEPS[n], 'kicker': f'Step {n}', 'sub': 'Not recorded yet: the installs are recorded on a fresh cluster.'}, 'secs': 3}


def clip(name, start, end, label=None, speed=None, caption=None):
    return {'clip': name, 'start': start, 'end': end, 'label': label, 'speed': speed, 'caption': caption}


TITLE = {'card': {'title': 'Tenants on OpenShift, carried into Vault Enterprise', 'sub': 'Multi-Tenant Operator · OpenShift · Vault Enterprise'}, 'secs': 4}
PROBLEM = {'card': {'title': 'Define a team once, as a tenant, and Vault follows.',
                    'kicker': 'The problem',
                    'sub': 'OpenShift keeps teams apart. Vault keeps secrets apart. They don’t agree on who a team is. Multi-Tenant Operator connects them.'},
           'secs': 8}
END = {'card': {'title': 'Try it free', 'kicker': 'Multi-Tenant Operator',
                'sub': 'The Basic edition manages two tenants, with no expiry.',
                'lines': ['Tutorial: ' + TUTORIAL, 'Docs: ' + DOCS]}, 'secs': 7, 'logo': True}
END['card']['logo'] = True
SPLIT = {'split': True, 'left': ('08-tenants-terminal', 2.5, 8.5), 'right': ('08-vault-split', 4.0, 13.2)}

L7, L8, L9, L10 = (f'Step {n}: {STEPS[n]}' for n in (7, 8, 9, 10))

VERSIONS = {
    'walkthrough': [
        clip('00-cold-open', 4.5, 13.5),
        clip('00-cold-open', 16.5, 23.6),
        TITLE, PROBLEM,
        *[todo(n) for n in range(1, 7)],
        chapter(7),
        dict(SPLIT, label=L7),
        clip('08-tenants-terminal', 11.5, 23.5, L7),
        clip('08-tenants-terminal', 26.0, 38.5, L7),
        clip('08-tenants-terminal', 41.0, 51.0, L7),
        clip('08-consoles', 5.0, 14.5, L7),
        clip('08-consoles', 17.0, 26.0, L7),
        clip('08-consoles', 30.5, 36.0, L7),
        clip('08-consoles', 39.5, 44.2, L7),
        chapter(8),
        clip('09-app-terminal', 2.5, 15.0, L8),
        clip('09-app-terminal', 15.0, 30.0, L8, speed=4),
        clip('09-app-terminal', 30.0, 37.4, L8),
        clip('09-app', 5.5, 14.0, L8),
        clip('09-app', 16.5, 23.5, L8),
        clip('09-app', 29.5, 36.9, L8),
        chapter(9),
        clip('10-rotate-terminal', 3.0, 14.0, L9),
        clip('10-rotate-terminal', 14.0, 27.0, L9, speed=4),
        clip('10-rotate-terminal', 27.0, 44.0, L9),
        clip('10-rotate-terminal', 44.0, 58.0, L9, speed=4),
        clip('10-rotate-terminal', 58.0, 63.3, L9),
        clip('10-rotate', 3.0, 12.0, L9),
        clip('10-rotate', 17.0, 26.6, L9),
        chapter(10),
        clip('11-isolation-terminal', 3.0, 47.0, L10),
        clip('11-isolation-terminal', 47.0, 125.0, L10, speed=12),
        clip('11-isolation-terminal', 125.0, 128.3, L10),
        {'card': {'title': 'What you built', 'lines': [
            'Two tenants, each with its own Vault namespace',
            'Secrets by annotation, with no Vault token or ticket',
            'Rotations that reach the running pod',
            'A boundary between tenants that holds']}, 'secs': 7},
        END,
    ],
    'demo': [
        clip('00-cold-open', 6.0, 13.5),
        clip('00-cold-open', 16.5, 23.6),
        TITLE, dict(PROBLEM, secs=7),
        {'card': {'title': 'Setup', 'kicker': 'Steps 1 to 6',
                  'sub': 'Multi-Tenant Operator · Vault Enterprise · Vault Config Operator · External Secrets Operator · Reloader · the Vault extension',
                  'lines': ['Not recorded yet: a fast, labeled install sequence goes here.']}, 'secs': 5},
        dict(SPLIT, label='Two tenants'),
        clip('08-consoles', 30.5, 36.0, 'Two tenants'),
        clip('08-consoles', 39.5, 44.2, 'Two tenants'),
        clip('09-app-terminal', 6.5, 11.5, 'An app gets its secret'),
        clip('09-app-terminal', 31.0, 37.4, 'An app gets its secret'),
        clip('09-app', 16.5, 23.5, 'An app gets its secret'),
        clip('09-app', 30.0, 36.9, 'An app gets its secret'),
        clip('10-rotate-terminal', 28.0, 35.0, 'Rotation'),
        clip('10-rotate-terminal', 58.0, 63.3, 'Rotation'),
        clip('10-rotate', 3.0, 12.0, 'Rotation'),
        clip('10-rotate', 18.0, 24.0, 'Rotation'),
        clip('11-isolation-terminal', 28.0, 44.0, 'The boundary holds'),
        clip('11-isolation-terminal', 47.0, 125.0, 'The boundary holds', speed=12),
        clip('11-isolation-terminal', 125.0, 128.3, 'The boundary holds'),
        dict(END, secs=6),
    ],
    'short': [
        clip('00-cold-open', 6.0, 13.5, caption='Two teams. One OpenShift cluster. Each with its own Vault.'),
        dict(SPLIT, caption='Create a tenant, and its Vault namespace appears.'),
        clip('09-app-terminal', 6.5, 11.5, caption='An app asks for its secret with annotations.'),
        clip('09-app-terminal', 32.0, 37.4, caption='No Vault token. No ticket.'),
        clip('10-rotate', 3.0, 12.0, caption='Rotate it in Vault, and the pod picks it up.'),
        clip('11-isolation-terminal', 28.0, 42.0, caption='The other team is refused: 403.'),
        dict(END, secs=5),
    ],
}


def build(name):
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix=f'assemble-{name}-')
    parts = []
    for i, seg in enumerate(VERSIONS[name]):
        out = os.path.join(tmp, f'{i:03d}.mp4')
        if 'card' in seg:
            seg = dict(seg, card=dict(seg['card'], logo=seg.get('logo', seg['card'].get('logo', False))))
            render_card(seg, out, tmp)
        elif seg.get('split'):
            render_split(seg, out, tmp)
        else:
            render_clip(seg, out, tmp)
        parts.append(out)
    lst = os.path.join(tmp, 'list.txt')
    with open(lst, 'w') as f:
        f.writelines(f"file '{p}'\n" for p in parts)
    target = os.path.join(OUT, f'{name}-preview.mp4')
    ffmpeg('-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', target)
    shutil.rmtree(tmp)
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', target]).decode())
    print(f'{target}  {int(dur // 60)}:{int(dur % 60):02d}')


if __name__ == '__main__':
    for name in (sys.argv[1:] or ['demo', 'walkthrough', 'short']):
        build(name)
