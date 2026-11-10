# Agent instructions for Next.XP documentation

This repository is the Next.js starter for **Next.XP** — Enonic's integration between Next.js and Enonic XP. It also contains the Next.XP reference documentation in `docs/`, written in AsciiDoc and published to https://developer.enonic.com/docs/next.xp.

Shared conventions for Enonic documentation (publishing pipeline, menu and version files, AsciiDoc rules, library reference tables) are in the `enonic-docs` skill from the `enonic-contrib` plugin of https://github.com/enonic/agent-toolkit. Install it and follow it for every change under `docs/`. The rules below are the ones specific to Next.XP, plus the few shared rules that must hold even without the skill.

`docs/`, this file, `CLAUDE.md` and `.github` are listed in `degit.json` so they are removed when the starter is scaffolded with `npx degit enonic/starter-nextjs`. Keep that list current if any of them move.

## Scope and audience

Next.XP is an umbrella product consisting of three components that ship together:

1. **`@enonic/nextjs-adapter`** — npm library used by the Next.js front-end. This is the main component and the version driver of the product.
2. **`starter-nextjs`** — this repository, the Next.js starter template, representing canonical adapter usage.
3. **`app-nextxp`** — the XP application (on Enonic Market) providing the back-end side: preview, component metadata, and front-end configuration.

The adapter depends on **`@enonic/react-components`**, a separately versioned supporting library for rendering XP component trees and rich text in React. It is not a Next.XP version driver, but document where the adapter uses it and where it provides Content Studio annotations.

The documentation covers all three, targeted at **front-end/Next.js developers** integrating with Enonic, but should also make sense for **Enonic developers** adding a Next.js front-end.

Keep content focused on Next.XP. The step-by-step tutorial lives in the `demo-nextjs` repo (published at https://developer.enonic.com/learn/next.xp) and builds on top of this content — do not duplicate tutorial material here. Link to https://nextjs.org/docs for framework concepts (app router, SSG/ISR, etc.) and only explain what is Next.XP-specific.

## Versioning

The product version follows the **adapter major**: Next.XP N means `@enonic/nextjs-adapter` major N. The starter and app-nextxp follow to the same major within the release window. Patch versions drift freely between components — document majors only, never exact patch alignment.

The adapter may run ahead of the product (e.g. adapter v6 betas before Next.XP 6 exists). The documentation tracks **released product majors**. `master` holds the current major; the outgoing major lives on a version branch such as `5.x`. Unreleased work on the next major is documented on its feature branch and published under the `next` docs version.

### Release checklist

When a new Next.XP major is released:

1. Tag and release the adapter major.
2. Align and release `app-nextxp` to the same major.
3. Cut a version branch for the outgoing major (e.g. `5.x`) from `master`, then merge the new major's branch into `master`.
4. Write release notes (`docs/release.adoc`) and upgrade notes (`docs/upgrade.adoc`).
5. Update `docs/versions.json`: point `stable` at `master`, pin the outgoing major to its branch, and remove `next`. Add the version branch to the `enonic-docgen` workflow.
6. Update `docs/.variables.adoc` with the new stack versions.
7. Update the tutorial (`demo-nextjs`) following its own versioning scheme.

## Content guidelines

This is **reference documentation**, not tutorials. Every page should be self-contained and useful on its own. Most adapter functions take a *single object argument*; document them with the library reference pattern from the skill (flat `Name | Type | Description` tables, required by default, inline single-use objects).

## Must-know rules even without the skill

- Every page in `docs/menu.json` has real content; add new pages to the menu.
- A section landing page is `docs/topic.adoc` with children in `docs/topic/`; no `index.adoc` in subdirectories.
- Wrap identifiers containing `_` in `+...+` outside source blocks.
- Use relative `<<path#,Label>>` links and never a `^` suffix.
- Only `.adoc` and `.json` files under `docs/` stay out of the published site; everything else becomes a page or a media item.
