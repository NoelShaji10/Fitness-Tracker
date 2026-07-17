# AuraCoach Design System — "The Logbook"

This document establishes the design tokens and visual guidelines for the AuraCoach rebuild.

## 1. Visual Concept: "The Logbook"
AuraCoach uses a structured, physical logbook/ledger aesthetic. It avoids the typical gloss, bubble shapes, and heavy gradients of generic SaaS dashboards. 
* **Layout**: Chronological, vertical flow (ledger format) with neat grid lines.
* **UI Elements**: Thin borders, tabular spacing, clear data hierarchy.
* **Theme**: Light-by-default mimicking physical paper, with a corresponding high-contrast dark mode for night training.

---

## 2. Color Palette (Named Tokens)

These colors are mapped directly in our Tailwind config (`src/app/globals.css`):

| Token Name | Hex Value | Intent / Role |
|---|---|---|
| `brand-ink` | `#1A1A1A` | Dark ink color. Used for copy, borders, active weights/reps, headers. (Dark mode background: `#121212`) |
| `brand-paper` | `#FDFBF7` | Warm, physical paper color. Light mode background. (Dark mode text/cards: `#EAEAEA`) |
| `brand-paper-dark` | `#F5F2EB` | Shaded paper color. Used for card backgrounds, table headers, disabled fields in light mode. |
| `brand-load` | `#2B5B84` | Steel-blue load accent. Highlight color for weights, sets, completed targets, and standard progressive overload. |
| `brand-strain` | `#B23B3B` | Brick-red strain. **Reserved strictly** for injury states, pain reporting, warning indicators, and tapering instructions. |
| `brand-gain` | `#3B7A57` | Olive gain. **Reserved strictly** for positive feedback: completed streaks, hit PRs, macro compliance, and injury-free resolutions. |

---

## 3. Typography

* **Tabular Figures**:
  * **Role**: All numbers, macros, weight loads, percentages, times, and timestamps.
  * **Font Family**: Monospace (`JetBrains Mono`, `Geist Mono`, or standard `ui-monospace`) with tabular-numeric styling.
  * **Tailwind Class**: `font-mono tabular-nums`

* **UI & Reading Copy**:
  * **Role**: Headings, body copy, descriptions, form labels, controls.
  * **Font Family**: Humanist/Clean Sans (`Geist Sans`, `Outfit`, `Inter`, or standard `system-ui`)
  * **Tailwind Class**: `font-sans`

---

## 4. Signature Component: "The Plate Stack"

The `PlateStack` is a discrete, visual meter showing progress in structural segments (representing weight plates on a barbell) instead of generic circular rings or smooth progress bars.

* **Layout**: Horizontal or vertical stack of small rectangles/blocks.
* **States**:
  * **Empty Segment**: Light gray / faint background outline.
  * **Load (Normal progression)**: Filled with Steel-Blue (`brand-load`).
  * **Strain (Injury / Pain report)**: Filled with Brick-Red (`brand-strain`).
  * **Gain (Macro hit / Streak)**: Filled with Olive (`brand-gain`).
* **Visual style**: 
  * Total segments: Fixed number (e.g. 5, 8, or 10 blocks) or relative depending on count.
  * Thin separation gaps (e.g., `gap-0.5`).
