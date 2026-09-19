# AdvoHQ Legal Workspace + SuitVal India

A full-stack legal drafting workspace built with Next.js/Vinext. It includes a Word-style editor, multi-document case files, page-linked notes, a parallel tool panel, print/index controls, and the existing deterministic suit valuation calculator.

## What is included

- Word-style rich-text tools: headings, fonts, sizes, bold, italic, underline, strike, colour, highlight, lists, indentation, alignment, links, quotes and tables.
- Multiple case documents and pages, including **Create new document** and **Create new page**.
- Browser-local save for frontend testing.
- Notes linked to a specific page.
- One **AI & Tools** launcher with:
  - Analyse AI with party/perspective selection.
  - Research & Case Law AI with advanced search filters and result cards.
  - Advo AI chat workspace.
  - Translation AI.
  - Suit Calculator.
  - Continuous document indexing.
- Side-by-side document and tool views.
- Print selected documents with continuous page numbers above or below each page.
- Existing Karnataka calculation backend and statutory regression tests.
- A state backend registry so future state rule packs can be connected without changing the UI.

The AI screens are frontend-ready previews. They deliberately do not claim to search live case-law databases or run a production AI model until those services are connected.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open the local URL printed in the terminal (normally `http://localhost:5173`).

For a production-style check:

```bash
pnpm build
pnpm start
```

## Verification

```bash
pnpm lint
pnpm test:rules
pnpm build
```

`pnpm test:rules` verifies ten Karnataka statutory calculation checkpoints, including the ₹5,00,000 money-recovery result of ₹33,375.

## Routes

- `/` — AdvoHQ legal workspace.
- `/calculator` — the existing SuitVal calculator UI.
- `/api/calculate` — deterministic calculation API.

## State-by-state backend model

The State selector sends a stable `stateId` to `/api/calculate`. `lib/legal/state-registry.ts` maps that ID to exactly one rule module and dataset. Karnataka (`ka`) is connected to `lib/legal/karnataka.ts`; every other State/UT resolves to an explicit placeholder until its official-source rule pack is implemented.

Recommended layout for a new State:

```text
lib/legal/states/tamil-nadu/
  data.ts          # verified schedules, thresholds and effective dates
  rules.ts         # valuation and fee formulas
  sources.ts       # official source metadata
  fixtures.ts      # statutory examples and regression cases
```

To connect a State later:

1. Create its isolated rule-pack folder.
2. Add official-source data and effective dates.
3. Implement its pure calculation function.
4. Add regression fixtures for each relief type and fee-band edge.
5. Register its two-letter ID in `lib/legal/state-registry.ts`.
6. Route that registry key in `lib/legal/engine.ts`.
7. Mark the jurisdiction as verified only after legal/source review.

Do not copy Karnataka formulas into another State. The shared UI contract stays the same; valuation, fee schedules, court thresholds and source versions belong to the selected State's backend.

## Important legal scope

This is a calculation and drafting aid, not a filing opinion. Court-fee statutes, amendments, local notifications, special forums and registry practice must be verified before filing. Stamp duty is a separate legal workflow from court fee and suit valuation and should be implemented as a separate rule pack.
