# Narration: the demo

The script for the demo, the main cut of the [video plan](plan.md). Read it
aloud, change anything that doesn't sound like you, then record it. The
picture is cut to fit your voice afterwards, so it can be recorded before the
screen recording exists.

**Pace:** natural, about 150 words a minute. Each part has more picture than
words, so pauses are fine; the picture fills them.

## Saying it

| Write | Say |
|---|---|
| Multi-Tenant Operator | Always in full, never "MTO" |
| acme | "ACK-mee" |
| globex | "GLOW-bex" |
| 403 | "four-oh-three" |
| Kubernetes | "koo-ber-NET-eez" |

## 1. Cold open

*15 seconds of picture · about 28 words*

> Two teams share one OpenShift cluster. Each has its own namespace in
> Vault Enterprise, its own secrets, its own login. And nobody wrote a line
> of Vault configuration.

## 2. The problem

*25 seconds · about 46 words*

> Here's the gap. OpenShift keeps teams apart. Vault keeps secrets apart.
> But they don't agree on who a team is, so someone fills that gap by hand,
> for every team, forever.
>
> Multi-Tenant Operator closes it. You define a team once, as a tenant, and
> Vault follows.

## 3. Setup

*50 seconds · about 72 words*

> Setting it up takes about an hour, and it's all standard tooling.
>
> Multi-Tenant Operator comes from the Software Catalog. It's Red Hat
> certified, and the Basic edition is free for two tenants.
>
> Then Vault Enterprise, with your own license. Vault Config Operator, to
> manage Vault from Kubernetes. External Secrets Operator, to deliver
> secrets into the cluster. Reloader, to restart pods when a secret changes.
>
> And last, the Vault extension for Multi-Tenant Operator.

## 4. Two tenants

*45 seconds · about 58 words*

> Now the part that matters. We create two tenants, acme and globex. That's
> two small resources.
>
> Multi-Tenant Operator creates their projects. And within a minute, each
> tenant has its own Vault namespace, with its own secrets engine and its
> own login. We didn't touch Vault.
>
> Multi-Tenant Operator's console shows both teams, and exactly which
> projects belong to each.

## 5. An app gets its secret

*40 seconds · about 65 words*

> Next, an app on the acme team needs its database password. Two
> annotations on its service account say what access it needs. One on its
> deployment says which secret. That's it. No Vault token, no ticket.
>
> Here's the Vault policy it was given, and nobody wrote it. And the password
> arrives as an ordinary Kubernetes Secret, so the app doesn't even know
> Vault is there.

## 6. Rotation

*30 seconds · about 40 words*

> Now rotate the password in Vault. The secret updates, Reloader restarts
> the pod, and the app has the new value.
>
> Rotate it again, and the same thing happens. Reloader's console keeps the
> record: what restarted, and which secret caused it.

## 7. The boundary holds

*30 seconds · about 43 words*

> Finally, prove the boundary holds. The globex app can read its own
> secrets. It can't read acme's: 403. It can't borrow acme's login either:
> 403.
>
> And if someone widens a policy by hand, a minute later it's back to what
> it should be.

## 8. Close

*15 seconds · about 24 words*

> Every step is in the tutorial, linked below, along with how to clean up.
> Try it free, with Multi-Tenant Operator, on your own cluster.

---

About 380 words in all: roughly 2½ minutes of speech over a 4-minute
picture.

## Recording it

- **Where:** a quiet room with soft furnishings: curtains, a sofa, a rug.
  Phone on silent, windows shut.
- **Microphone:** a USB microphone about a hand's width from your mouth,
  slightly off to the side. A pop filter if you have one.
- **Settings:** WAV, 48 kHz, 24-bit, mono. Any free tool, such as Audacity.
- **Before you start:** record 5 seconds of silence in the room. It's used
  to clean up the background.
- **One file per part,** named `demo-01-cold-open.wav` to
  `demo-08-close.wav`. Leave a second of silence before and after.
- **Two takes of each part.** If one sentence goes wrong, just re-read that
  sentence in the same file; it's cut in the edit.
- **Send the files** to the shared drive, not to Git; the repository keeps
  raw audio out on purpose. Tell us the folder.
