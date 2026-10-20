# Hands-on: [what the reader builds]

<!--
Template: copy to NN-try-it-[topic]/post.md. Replace every [bracket]; delete
sections marked (optional) if they don't apply.
Rules: CLAUDE.md, docs/guidelines/tutorial.md, docs/guidelines/screenshots.md.
Outlet: Red Hat Developer (tutorial), then the Stakater blog, canonical link back.
Companion to [the explainer], which explains why.
Screenshots: each "Screenshot to capture" block is a slot, filled during the
validation run. The full list, with highlights, is in screenshots/README.md.
-->

In [the explainer's title](../NN-[explainer]/post.md), we showed [the idea, in
one sentence]. This tutorial builds it, step by step.

By the end you'll have:

- [an outcome the reader can see]
- [an outcome the reader can see]
- [proof that the boundary or guardrail holds]

Allow about [time].

### Why this is a separate tutorial (optional)

[Only when it follows another tutorial: what's different here, and why it
stands on its own.]

## Before you start

You need:

- [the cluster, and the access needed]
- [anything the reader brings, such as a license]
- [the tools on their machine]
- The example files:

  ```bash
  git clone https://github.com/stakater/mto-blogs.git
  cd mto-blogs/NN-try-it-[topic]/examples
  ```

Here's what you'll install:

| Component | Version | From | Job |
|---|---|---|---|
| Multi-Tenant Operator | [version] | Software Catalog (OperatorHub) | [its job in this tutorial] |
| [component] | [version] | [source] | [its job] |

The Multi-Tenant Operator Basic edition is free with no expiry, and manages
up to two tenants. That's exactly what this tutorial uses.

## Step 1: [the outcome, not the command]

[One or two sentences: why this step.]

```bash
[the commands, copy-pasteable as they are]
```

```
[the expected output]
```

> 📷 **Screenshot to capture:** [the tool, the page, and what's on it]
> **Highlight:** [the elements to mark, named as they appear on screen]

**What just happened:** [what each component did, when it isn't obvious.]

**In production,** [the alternative to any learning shortcut this step takes.]

## Step 2: [the outcome]

[Repeat the step pattern. One outcome per step.]

## Optional: [an extra not every reader needs] (optional)

[Clearly marked as optional.]

## Clean up

[How to undo everything, in the order that works.]

```bash
[the commands]
```

## What you built

[The outcome in a few sentences. What was left out on purpose, and where it's
covered. Then where Enterprise comes in: "The free edition stops at two
tenants. When a third team arrives, that's where Multi-Tenant Operator
Enterprise comes in."]

## About Multi-Tenant Operator

Multi-Tenant Operator, from Stakater, turns a shared OpenShift cluster into
a platform of tenants. Each team is defined once, and that boundary reaches
its projects, its access, its quotas, its costs and, through extensions,
tools such as Vault. It's a Red Hat certified operator, available in
OperatorHub.

- **Try it free:** the Basic edition manages up to two tenants, with no
  expiry and no capability held back.
- **Learn more:** [docs.stakater.com/mto](https://docs.stakater.com/mto/)
- **Running more than two teams?** Multi-Tenant Operator Enterprise adds
  unlimited tenants and a support commitment. Contact
  [sales@stakater.com](mailto:sales@stakater.com).

---

*[Authors and their companies, as agreed for the topic.]*
