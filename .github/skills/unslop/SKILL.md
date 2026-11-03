---
name: unslop
description: "Audit and refine AI-looking web interfaces into intentional, product-specific UI. Use for visual polish, design cleanup, screenshot-driven frontend review, landing pages, dashboards, React, Next.js, Tailwind, spacing, typography, color, copy, icon, motion, and responsive improvements."
argument-hint: "[screen, route, or frontend area to review]"
user-invocable: true
---

# DocuMind UI refinement

Turn a screen that feels generic or AI-generated into a deliberate interface while
preserving behavior, accessibility, responsive layouts, and the product's evidence-first
identity.

## Operating rules

- Inspect before editing. Record concrete findings with file paths, selectors or
  component names, and approximate line locations.
- Prefer the smallest coherent set of changes. Do not redesign backend behavior,
  authentication, document retrieval, citations, or data contracts.
- Preserve the existing DocuMind visual language: warm paper surfaces, restrained
  teal accents, readable typography, source-focused hierarchy, and quiet controls.
- Do not introduce purple gradients, decorative glows, emoji as UI icons, excessive
  pill controls, noisy shadows, unsupported marketing claims, or copy that implies
  citations are optional.
- Use the existing `lucide-react` icon dependency for interface icons and keep icon
  labels accessible.
- Keep design tokens and repeated styles centralized in existing CSS or shared
  components instead of scattering one-off overrides.
- Do not add a dependency unless the user explicitly asks for it or the existing
  screenshot/test workflow cannot run without it.

## Workflow

### 1. Establish scope and baseline

1. Identify the requested route or screen. If no target is given, inspect the
   landing page, then the authenticated app shell.
2. Read the relevant route, view components, shared components, and
   `app/globals.css` before changing anything.
3. Check `git status --short` and avoid overwriting unrelated worktree changes.
4. Run the smallest available baseline:
   - `npm run lint` for static frontend changes.
   - `npm test` when shared behavior or state is involved.
   - `npm run screenshots` when the dev server is available and the request is
     visual or responsive.

### 2. Audit the screen

Review the target in this order:

1. Product signal: does the hierarchy communicate private, source-grounded answers?
2. Layout: alignment, grouping, whitespace rhythm, container widths, and responsive
   behavior.
3. Typography: scale, line length, weight, contrast, and heading/body distinction.
4. Color: semantic roles, contrast, accent restraint, borders, and dark-mode parity.
5. Controls: affordance, states, focus rings, hit targets, and accessible names.
6. Content: concise labels, useful empty/loading/error states, and no fabricated
   evidence or claims.
7. Details: icon consistency, dividers, radii, shadows, and motion used only when
   it clarifies state.

Write findings as:

| Priority | Location | Observation | User impact | Proposed change |
|---|---|---|---|---|

Prioritize issues that affect comprehension or trust over purely decorative changes.

### 3. Choose a direction

State one short design direction before editing. It must be derived from DocuMind's
actual product character, for example: "quiet research desk: paper-like surfaces,
precise source markers, and one confident accent." Define:

- one primary accent and its semantic use;
- one surface/border/shadow treatment;
- the type hierarchy and spacing rhythm;
- one restrained signature detail, such as a clear citation marker or evidence rail.

Do not add a new theme or visual system when the current tokens can express the
direction.

### 4. Apply the polish passes

Make changes in this order so visual decisions remain explainable:

1. spacing and alignment;
2. color and contrast;
3. iconography and control states;
4. copy and labels;
5. typography;
6. layout and responsive behavior;
7. borders, radii, shadows, and details;
8. imagery or motion only when they serve the document-reading task.

Keep semantic HTML, keyboard navigation, focus visibility, reduced-motion behavior,
and mobile usability intact. If a change alters behavior, update or add a focused
test instead of relying on a screenshot.

### 5. Verify and report

1. Re-run the applicable lint/tests and screenshot flow.
2. Compare the result against the baseline at desktop and mobile widths.
3. Check the target route for console errors, broken links, clipped content,
   insufficient contrast, and unusable focus states.
4. Report:
   - audit findings that were addressed;
   - files changed;
   - any intentional behavior or copy changes;
   - validation commands and results;
   - remaining visual risks.

Never claim a visual improvement was verified if the route could not be rendered.
When screenshots or a browser are unavailable, clearly distinguish code inspection
from runtime verification.

## DocuMind surfaces

- Landing page: communicate traceable answers without generic AI-app spectacle.
- Authentication: make trust, errors, and next actions obvious with minimal noise.
- App shell/sidebar: keep document identity, navigation, and responsive collapse clear.
- Workspace/chat: make the answer, question, retrieval status, and citations distinct.
- Sources/citations: preserve page numbers and quoted evidence as the strongest visual
  proof of the product's value.
- Settings and empty states: explain what the user can do next without invented data.

Use the existing project screenshot command at
[`scripts/capture-screenshots.mjs`](../../../scripts/capture-screenshots.mjs) when
runtime capture is needed.
