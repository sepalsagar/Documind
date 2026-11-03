# UI audit checklist

Use this as a compact review checklist; the skill file defines the workflow and
project-specific constraints.

## Trust and clarity

- [ ] The primary action is visually distinct and accurately labeled.
- [ ] Answer, evidence, page number, and retrieval/loading states are distinguishable.
- [ ] Empty, error, and unavailable states tell the user what to do next.
- [ ] Copy makes no unsupported claims about document processing or AI quality.

## Visual system

- [ ] Spacing follows a repeatable rhythm.
- [ ] Heading, body, metadata, and mono/source text have clear roles.
- [ ] Accent color is reserved for actions, state, and evidence markers.
- [ ] Borders and shadows establish hierarchy without decorative noise.
- [ ] Icons come from the shared icon library and have accessible labels.

## Interaction and responsive behavior

- [ ] Buttons and links have visible hover, focus, active, and disabled states.
- [ ] Keyboard focus is visible and follows the visual order.
- [ ] Touch targets remain usable on narrow screens.
- [ ] Long filenames, questions, citations, and errors do not overflow.
- [ ] Reduced-motion users are not forced to see nonessential animation.

## Verification

- [ ] Target route renders without console errors.
- [ ] Desktop and mobile screenshots were compared when the change is visual.
- [ ] `npm run lint` passes.
- [ ] Focused tests pass when shared behavior changed.
