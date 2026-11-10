# Agent Instructions for Next.XP Documentation

This repository contains the reference documentation for **Next.XP** — Enonic's integration between Next.js and Enonic XP — written in AsciiDoc.

## Scope and Audience

Next.XP is an umbrella product consisting of three components that ship together:

1. **`@enonic/nextjs-adapter`** — npm library used by the Next.js front-end. This is the main component and the version driver of the product.
2. **`starter-nextjs`** — the Next.js starter template (github.com/enonic/starter-nextjs), representing canonical adapter usage.
3. **`app-nextxp`** — the XP application (on Enonic Market) providing the back-end side: preview, component metadata, and front-end configuration.

The adapter depends on **`@enonic/react-components`**, a separately versioned supporting library for rendering XP component trees and rich text in React. It is not a Next.XP version driver, but document where the adapter uses it and where it provides Content Studio annotations.

This repo documents all three, targeted at **front-end/Next.js developers** integrating with Enonic, but should also make sense for **Enonic developers** adding a Next.js front-end.

Keep content focused on Next.XP. The step-by-step tutorial lives in the `demo-nextjs` repo (published at https://developer.enonic.com/learn/next.xp) and builds on top of this content — do not duplicate tutorial material here.

## Versioning model

The product version follows the **adapter major**: Next.XP N means `@enonic/nextjs-adapter` major N. The template and app-nextxp follow to the same major within the release window. Patch versions drift freely between components — document majors only, never exact patch alignment.

The adapter may run ahead of the product (e.g. adapter v6 betas before Next.XP 6 exists). This documentation tracks **released product majors**, not the adapter's master branch. Unreleased work is documented under the `next` docs version.

### Release checklist

When a new Next.XP major is released:

1. Tag and release the adapter major.
2. Align and release `starter-nextjs` and `app-nextxp` to the same major.
3. Write release notes (`docs/release.adoc`) and upgrade notes (`docs/upgrade.adoc`) in this repo.
4. Cut a version branch for the outgoing major (e.g. `5.x`) and pin it in `docs/versions.json`; point `stable` at the new major.
5. Update `docs/.variables.adoc` with the new stack versions.
6. Update the tutorial (`demo-nextjs`) following its own versioning scheme.

## Content Guidelines

This is **reference documentation**, not tutorials. Every page should be self-contained and useful on its own.

### LLM-readability
This documentation should be highly useful for LLMs learning about Enonic and Next.XP. To support this:

- **No empty stubs.** Every page in `menu.json` must have substantive content. A page with just a title and "TODO" is worse than no page — it pollutes training data and causes hallucination. If content isn't ready, remove the page from the menu.
- **Self-contained pages.** Minimize "see external docs for details" without context. Summarize the key concept locally, then link out for the full reference. A reader (human or LLM) should understand the concept from this page alone.
- **Consistent structure.** Use the same pattern across similar pages when applicable.

### External references
When referencing separately documented components, provide a brief summary and link:

- **Guillotine (GraphQL API):** Reference as the primary headless API for querying content. Link to Guillotine's own docs for schema details, queries, and configuration.
- **Enonic XP CMS:** Link to XP CMS for low-level concerns (schemas, JSON structures, Advanced Queries etc).
- **Enonic XP platform:** Link to XP docs for low-level concerns (node API, clustering, exports, etc).
- **Next.js:** Link to https://nextjs.org/docs for framework concepts (app router, SSG/ISR, etc.) — only explain what is Next.XP-specific.
- **Next.XP tutorial:** Link to https://developer.enonic.com/learn/next.xp for step-by-step guidance.

## Build, Test, and Lint

This project relies on GitHub Actions for building and publishing. There are no local build scripts.

- **CI Build:** The documentation is generated and published via the `.github/workflows/enonic-docgen.yml` workflow using `enonic/release-tools/generate-docs`.
- **Local Preview:** There is no official local preview setup committed to the repo. Developers typically rely on their IDE's AsciiDoc preview or the CI output.
- **Validation:** Validation happens during the CI build process.

## High-Level Architecture

- **Source Directory:** All documentation source files are located in `docs/`.
- **Format:** Content is written in [AsciiDoc](https://asciidoc.org/) (`.adoc`).
- **Publishing:** The build crunches and imports the result into Enonic XP, where it will be only one of many aggregated documentation packages.
- **Location:** This documentation will be published in a specific location on developer.enonic.com, but controlled from the CMS.
- **Structure:** The structure of the adoc files are mapped to a corresponding relative URL. For example `docs/release.adoc` and `docs/upgrade.adoc` in this repo have URL patterns `/release` and `/upgrade` respectively.
- **Section landing pages:** The importer does not support `index.adoc` inside subdirectories. A section landing page must have the same basename as its optional child directory: use `docs/app.adoc` with children under `docs/app/`, not `docs/app/index.adoc`. The root `docs/index.adoc` remains the documentation entry point.
- **Navigation:** The site navigation and menu structure are defined in `docs/menu.json`.
- **Versioning:** Documentation versions are configured in `docs/versions.json`.
Each version object supports the following fields: `label` (used in URL path and version dropdown), `checkout` (git ref to use), `displayName` (overrides the label, excluding url name). Additionally, one and only one of the versions may have the `"latest": true` flag. This is important, as it sets the default version to show on the site, and use in searches. Label `next` should be used for un-released bigger updates, and will prevent indexing in search engines.
- **Variables:** Common attributes (stack versions, doc URLs) are defined in `docs/.variables.adoc` (dot-prefixed, so it is excluded from the CMS import). Include it below the chapter title and reference attributes like `{adapter-version}`.
- **Entry Point:** `docs/index.adoc` is the main entry point for the documentation.

## Key Conventions

- **Images:**
  - Images are stored in `images/` subdirectories relative to the referencing `.adoc` file.
  - In AsciiDoc files, the `:imagesdir:` is set to `images`.
  - Example: `image::my-image.png[]` (where `my-image.png` is placed in `docs/images/`).
- **Documenting library functions and types:** Most adapter functions take a *single object argument*. Document them with flat, linked tables — never nested tables.
  - **Page itinerary — fixed top-level sections, in this order:** `== Usage`, `== Functions`, `== Classes`, `== Type Definitions`, then `== Events` and `== Constants` *only if the library has them*. Group strictly by kind: functions as `=== fnName` under `== Functions`; a class as `=== ClassName` under `== Classes` with its members as `==== memberName`; each *reused* type as `=== TypeName` under `== Type Definitions`. Within a function or method, use `[.lead]` labels (`Parameters`, `Returns`, `Example`) rather than sub-headings.
  - **Single-object parameter:** lead in with *"``<fn>()`` takes a single `params` object with these properties:"* followed by **one flat table** with columns `Name | Type | Description`. Do *not* add an outer `params | object | …` row, do *not* use nested AsciiDoc tables (`!===`), and do *not* flatten sub-objects with dot-notation.
  - **Optionality — required by default.** There is no "required" column. A field is *required* unless its Description begins with `*Optional.*`. Put any default value in the Description too.
  - **Inline single-use objects; break out only when reused.** A `params`/`options` object used by *one* function is documented *inline* in that function. Only when the *same* object shape is reused across multiple functions do you break it out into `== Type Definitions` with an explicit anchor (`[#some-type]`) and reference it from the Type column (`<<some-type, SomeType>>`).
  - **Table style:** borderless three-column tables — `[%header,cols="1%,1%,98%a"]` with `[frame="none"]` and `[grid="none"]`.
  - **Reference examples:** see `docs/libraries/lib-scheduler.adoc` in the doc-code repo for the canonical pattern.
- **Menu Updates:** When adding new documentation pages, you MUST update `docs/menu.json` to ensure they appear in the docs navigation.
- **Links:**
  - Use relative links between `.adoc` files (e.g., `<<path/to/doc#,Label>>`).
  - Do *not* use the `^` suffix on link labels (e.g., `[Label^]`) — neither for cross-doc links within `developer.enonic.com` nor for genuinely external sites. Forcing a new tab removes user agency; readers who want one can middle-click or Cmd-click.
- **Underscores in inline text — be extremely careful:** AsciiDoc parses paired underscores as italic, so any identifier, path, or URL placeholder that contains `_` can silently break formatting (a single `_` opens an italic run that swallows the rest of the line). Wrap such strings in single-plus passthrough — `+text_with_underscores+`. For monospaced URL patterns and identifiers, combine with backticks: `` `+/_/media:image/+` ``. Content inside a fenced source block is safe. When in doubt, wrap it in `+`.
