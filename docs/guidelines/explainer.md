# Explainer guideline

The explainer answers **why, and how does it work**, for the people
deciding whether to try something. It ends by sending them to the tutorial
and to Multi-Tenant Operator. Examples: [post 1](../../01-tenants-and-vault-enterprise/post.md),
[post 3](../../03-one-login-for-tenant-members/post.md).

The rules in [CLAUDE.md](../../CLAUDE.md) apply to every piece. This page
adds what is specific to an explainer.

## Shape

About 1,500 to 2,000 words. The sections, in order:

| Section | What it does |
|---|---|
| **Opening** | A concrete scene or question the reader recognizes: forty teams and their secrets; Anna's first day. Then the gap, in two or three short paragraphs, and the approach in one. |
| **In this article** | Five bullets, matching the sections that follow, in order |
| **Who it's for** | The reader, what they should already know, and that Multi-Tenant Operator is introduced from the ground up |
| **Want to build it?** | A link to the tutorial, and one line on how the two differ |
| **Why this is separate** | Only when the topic follows another: why it's its own article |
| **What it costs today** | The work done by hand, shown, not asserted: real commands or a concrete list, then multiplied across teams, then the upkeep. Then the ways it breaks. |
| **The idea** | The tenant, and how one boundary carries into the tool. A small YAML example where it helps. |
| **By hand vs. with Multi-Tenant Operator** | A table: each manual step, and what takes it over |
| **How it works** | The components, and one diagram: a Mermaid sequence for a flow, or a flowchart for structure |
| **What people see** | Screenshots of the result, in the tool's own UI |
| **Guardrails** | What the security, Vault or identity owner will ask: what the automation can and can't do, what the tests prove, and anything they should keep control of |
| **Try it** | The free Basic edition, what the reader brings, and the tutorial link. What's not supported yet, and what's on the roadmap. |
| **What's next** | Where the series goes, without giving the next topic away |
| **About Multi-Tenant Operator** | The standard closing section |
| **Byline** | The authors and their companies |

## Do

- **Show the cost before the cure.** The value of the automation is only as
  clear as the manual work it replaces.
- **Answer the owner's first question before they ask it.** For Vault: what
  permissions does the automation need? For identity: who controls the
  groups?
- **Say plainly what isn't supported yet,** and what's on the roadmap, with
  no dates unless engineering has them.
- **Name Multi-Tenant Operator in the opening,** and make clear what it does
  in the story.

## Don't

- Don't use insider backstory: pull requests, field names, version history.
- Don't put install steps in the explainer. They belong in the tutorial.
- Don't overclaim. If a guardrail depends on how it's set up, say how.

## Checklist

- [ ] The opening says who it's for and what they'll get, in the first screen.
- [ ] The manual work is shown, not just described.
- [ ] Every claim traces to the extension's tests or docs.
- [ ] One diagram at least, where it clarifies the design.
- [ ] Guardrails answer the owner's first question.
- [ ] Links to the tutorial, near the top and in "Try it".
- [ ] Ends with "About Multi-Tenant Operator" and the byline.
- [ ] No "MTO", no prices, no comparisons with competitors.
