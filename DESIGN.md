---
name: Ledger
description: A private, offline ledger grown from a botanical palette and rounded, hand-touched forms.
colors:
  alabaster: "#f9f8f4"
  paper: "#ffffff"
  clay: "#f2f0eb"
  forest: "#2d3a31"
  sage: "#8c9a84"
  sage-ink: "#5c6a54"
  terracotta: "#c27b66"
  terracotta-ink: "#a0563f"
  stone: "#e6e2da"
  secondary-ink: "#5a655c"
  tertiary-ink: "#667066"
  night-field: "#171c18"
  night-raised: "#1f251f"
  night-ink: "#efede6"
  night-secondary: "#a9b2a6"
typography:
  hero:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "54px"
    letterSpacing: "-1.2px"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.8px"
  subtitle:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.4px"
  heading:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "26px"
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "14px"
    letterSpacing: "1.4px"
  caption:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.1px"
  amount:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "20px"
    fontFeature: "tnum"
  amount-large:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "26px"
    fontFeature: "tnum"
  quote:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: "32px"
rounded:
  none: "0px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  pill: "999px"
spacing:
  half: "2px"
  one: "4px"
  two: "8px"
  three: "16px"
  four: "24px"
  five: "32px"
  six: "48px"
  seven: "64px"
  eight: "96px"
elevation:
  sm: "0 4px 6px rgba(45, 58, 49, 0.05)"
  md: "0 10px 15px rgba(45, 58, 49, 0.05)"
  lg: "0 20px 40px rgba(45, 58, 49, 0.05)"
  xl: "0 25px 50px rgba(45, 58, 49, 0.15)"
motion:
  fast: "300ms"
  base: "500ms"
  slow: "700ms"
  slower: "1000ms"
  easing: "cubic-bezier(0.33, 1, 0.68, 1)"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.alabaster}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 32px"
    height: "52px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.sage-ink}"
    borderColor: "{colors.sage}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.terracotta-ink}"
    borderColor: "{colors.terracotta}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
  icon-button:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    size: "44px"
  segmented-track:
    backgroundColor: "{colors.clay}"
    rounded: "{rounded.pill}"
    height: "48px"
  segmented-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    elevation: "{elevation.sm}"
  chip:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.forest}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.alabaster}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest}"
    rounded: "{rounded.lg}"
    padding: "24px"
    elevation: "{elevation.md}"
  plate:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.alabaster}"
    rounded: "{rounded.lg}"
    padding: "24px"
    elevation: "{elevation.lg}"
  text-field:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.forest}"
    borderColor: "{colors.sage}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "52px"
  fab:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.alabaster}"
    rounded: "{rounded.pill}"
    size: "56px"
    elevation: "{elevation.lg}"
  category-mark:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.sage-ink}"
    typography: "{typography.heading}"
    rounded: "{rounded.md}"
    size: "40px"
---

# Design System: Ledger

## Overview

**Creative North Star: "The Botanical Ledger"**

Ledger is set like a specimen book kept by someone careful: warm paper, ink drawn from a forest floor, and forms that were shaped rather than cut. The subject is money, and the palette is what money grows from — a seedling, a season, a balance that goes up. This system borrows that world's materials rather than its nostalgia. Nothing here is trying to look rustic. It is trying to look *grown*.

The page is alabaster, not white, and the whole of it carries a paper grain at 3% — the one texture that separates a screen from a sheet. Structure comes from **space and soft elevation** rather than from ruled lines: a card is a rounded plate resting on the ground, and a section is separated by nothing at all. Emphasis is a **deep-forest plate**, and there is at most one per screen.

Colour does real work here, which is the sharpest break from the system this replaced. Sage marks what is healthy and what is in reach; terracotta marks what is over a limit and what has gone wrong. But colour **reinforces and never carries**: every direction is still stated by sign and arrow, and every state is still stated in words. Remove the hue and the interface is exactly as legible.

Density is deliberately low, and it is the product's main structural rule. A screen states its headline and then *names* its detail rather than showing it — a summary row with a chevron instead of a table, a sheet instead of a section. Nothing is removed from the product; it is removed from the viewport.

**Key Characteristics:**
- One stock (Alabaster), one ink (Forest), and a paper grain over everything.
- Colour reinforces meaning; sign, arrow and words carry it. Never the reverse.
- Structure is soft elevation and space. A card floats; a section is a gap.
- Rounded everywhere. The arch is the signature shape.
- Two voices: Playfair Display for headlines, Source Sans 3 for everything else.
- Motion is slow and eased for entrances, fast and tactile for presses.

## Colors

A warm neutral ground with three earth pigments, each doing a job rather than decorating.

### Primary
- **Forest** (`#2d3a31`): The ink. Primary text, the primary action, and the one emphasis plate per screen. 11:1 on Alabaster.
- **Alabaster** (`#f9f8f4`): The stock. Page background and the text colour on any forest plate. Warm enough that true white reads as a highlight rather than a base.

### Secondary
- **Sage** (`#8c9a84`): Fills, chart series, progress, and the border of a secondary action. Too light for text at 2.5:1, so text uses **Sage Ink** (`#5c6a54`) instead — the same pigment at 5.4:1.
- **Terracotta** (`#c27b66`): The interactive pop, and the mark for over-budget and error. Same split: fills use Terracotta, text uses **Terracotta Ink** (`#a0563f`) at 5.1:1.

### Neutral
- **Paper** (`#ffffff`): Cards, which sit as true white against the alabaster ground.
- **Clay** (`#f2f0eb`): The quiet fill. Field backgrounds, icon discs, unselected chips, the rails behind a selected segment.
- **Stone** (`#e6e2da`): Structural borders, deliberately low contrast.
- **Secondary Ink** (`#5a655c`) at 5.6:1 and **Tertiary Ink** (`#667066`) at 4.9:1: metadata and hints, both past the 4.5:1 body floor.
- **Night Field** (`#171c18`) / **Night Raised** (`#1f251f`) / **Night Ink** (`#efede6`): dark mode is a designed forest-at-night appearance, not an inversion.

### Named Rules
**The Reinforces Rule.** Colour reinforces a state; it never carries one alone. Direction is stated by sign and by a drawn arrow; an over-budget envelope says "over by $42.00" in words as well as in terracotta. Delete every hue from a screenshot and the interface must still be unambiguous. This is non-negotiable, and it is what keeps the app legible in grayscale, in print, and to a reader with colour-vision deficiency.

**The Two Pigments Rule.** Sage and terracotta each ship twice — once as a fill and once as an ink dark enough to set text in. A fill colour used as a text colour is a defect: Sage at 2.5:1 fails every floor there is.

**The One Plate Rule.** A screen has at most one deep-forest plate. It is the loudest thing the system can say, and saying it twice says nothing.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Interface Font:** Source Sans 3 (with system-ui, sans-serif)

**Character:** A high-contrast didone for headlines and for the one figure that deserves to be looked at, and a humanist sans for everything that has to be read — including the figures. The mono this system replaced is gone: its numerals are cramped and technical, and a ledger read at a glance wants open, humanist digits. Alignment is kept by `tnum`, not by a fixed pitch.

### Hierarchy
- **Hero** (600, 48/54, −1.2px): The single headline figure on a screen — net worth, or this month's spend.
- **Title** (600, 34/40, −0.8px): Page titles, and the figure inside a sheet answer.
- **Subtitle** (600, 22/28, −0.4px): Section headings inside a card, and sheet titles.
- **Heading** (600, 17/24): Row titles, list labels, settings entries.
- **Body** (400, 17/26): Reading text. Held to a 720px measure.
- **Label** (600, 11/14, 1.4px, uppercase): Section eyebrows, button labels, field labels, status pills.
- **Caption** (400, 12/16): Metadata — dates, counts, units, "of $250.00".
- **Amount** (500, 15/20, tabular): Every figure in a list or table.
- **Amount Large** (600, 20/26, tabular): Figures in a stat row.
- **Quote** (400 italic, 22/32): The emphasised word in a tour headline, and pull quotes.

### Named Rules
**The Two Voices Rule.** Playfair Display is only ever used for a headline, a hero figure, or the italic word inside a headline. Source Sans 3 is used for every other run, including figures and labels. The two do not borrow from each other, and a third face is not introduced for decoration.

**The Italic Rule.** At most one word in a headline takes the Playfair italic — *This is **Ledger***, *Nothing **leaves***. Emphasis by italic is a single gesture; a headline with two italic words has none.

**The Tabular Rule.** Every monetary figure carries `font-variant-numeric: tabular-nums`, so a column stays in step even in a proportional face. Right-alignment in a list is the safety net where a platform ignores the feature.

## Layout

A single centred measure of 720px on a page whose padding is 24px (`spacing.four`). On a phone it is simply full width; on a tablet or the web it keeps the app reading as a column of type rather than a stretched panel.

Vertical rhythm runs on a 16px step between related elements and 24px between sections, opening to 32px and 48px where a screen needs to breathe. This system is generous with space in a way the one it replaced was not: a section separated by 48px of nothing reads as calm without a single rule.

**Density is the product's main structural rule.** A screen shows a headline and then names its detail. Concretely:

- **Stated once.** A figure appears once on a screen. `Net` is not shown beside `In` and `Out`, because it is their subtraction. `Left` is not shown beside a budget's limit and spend, because it is their difference. The month is not shown in both a header subtitle and a switcher.
- **Summary over table.** A screen that would need a table shows a headline plus one-line doors that open a sheet. Insights carries six doors where it used to carry eight blocks of figures.
- **The chart is the percentage.** Where a bar or a series already encodes a proportion, the proportion is not also printed as a number.

Screens own their own safe-area insets rather than relying on the platform: native tabs run with `disableAutomaticContentInsets`, and `Screen` applies top and bottom padding itself. That is why layouts are identical across iOS, Android and web.

## Elevation & Depth

**Elevation is soft, diffused, and tinted with the ground.** Shadows are drawn in Forest at 5% rather than in black, so a lifted card reads as sitting on warm paper rather than under a grey smudge. Four levels exist: `sm` for a selected segment, `md` for a card, `lg` for the emphasis plate and the floating action, `xl` for a sheet.

Depth is also conveyed by **tone** — a forest plate sits visually in front of the alabaster ground — and by **negative space**, which is the primary separator in this system.

### Named Rules
**The Tinted Shadow Rule.** No shadow is black. Every level uses Forest at 5% opacity, with `xl` at 15%. A black drop shadow on a warm ground reads as dirt.

**The Elevation Matches the Tone Rule.** A card is Paper on Alabaster with `md`; the emphasis plate is Forest on Alabaster with `lg`. A raised element that is not raised in tone reads as a mistake rather than as depth.

## Shapes

**Every corner is rounded, and the arch is the signature.** Radius runs `sm` 8px, `md` 16px, `lg` 24px, `xl` 32px, `pill` 999px. Cards are `lg`, fields and category marks are `md`, buttons and chips are `pill`, and icon discs are `pill`.

The **arch** — a rectangle fully rounded at the crown and only slightly at the base — is the one shape that belongs to this system alone. It holds the wordmark's seedling, it frames every step of the guided tour, and it is what a photograph would occupy on a marketing page. It is built from `borderTopLeftRadius: width / 2` over a `md` base, so it scales with its width rather than being pinned to a size.

Borders are rare and always low contrast. A card has no border at all; a field has a 1px Stone edge that becomes Sage on focus. The heavy rules of the previous system are gone.

### Named Rules
**The Round Corner Rule.** There is no hard corner anywhere — not on a card, a chip, a field, a keypad key, a PIN dot, an avatar or the floating action button. A single square corner breaks the geometry the system rests on.

**The Arch Rule.** The arch is reserved for the brand and for step art. Using it as a generic container spends the one shape that makes the interface recognisable.

## Components

### Buttons
Soft and pill-shaped.
- **Shape:** `pill`, 52px tall, 32px horizontal padding, label set in `label` (tracked uppercase sans).
- **Primary:** Forest fill, Alabaster label, `elevation.sm`.
- **Secondary:** transparent with a 1px Sage border and a Sage Ink label.
- **Destructive:** transparent with a 1px Terracotta border and a Terracotta Ink label.
- **Ghost:** no border, no fill, underlined label.
- **Press:** the surface eases to 96% over 300ms and returns. Fast, because a press is confirmation rather than transition.

### Chips
- **Style:** `pill`, 36px tall, Clay fill, Forest label.
- **State:** selected is a Forest fill with an Alabaster label. There is no third state.

### Cards / Containers
- **Corner Style:** `lg` (24px).
- **Background:** Paper — true white against the alabaster ground.
- **Shadow Strategy:** `elevation.md`, tinted Forest.
- **Border:** none. A card is defined by its tone and its lift, not by an edge.
- **Internal Padding:** `spacing.four` (24px).
- **Note:** a card is the default container. Sections that need separating get one; nothing is nested.

### Inputs / Fields
- **Style:** Clay fill, `md` radius, no visible border until focus, 52px tall.
- **Focus:** the border eases to Sage. There is no harsh ring, and the web build sets `outline-width: 0` so the browser default does not stack with it.
- **Error:** the border becomes Terracotta and the message below is set in Terracotta Ink, naming the problem and the recovery in words.

### Sheets
- **Shape:** rounded at the crown only (`xl` on the top two corners), lifted on `elevation.xl`.
- **Motion:** slides in. This is the one place the previous system's instant appearance was most likely to feel abrupt.
- **Keyboard:** the sheet reads the keyboard height and pads itself, so a field inside one is never covered. Under edge-to-edge, Android 15 ignores `adjustResize`, so this is handled explicitly rather than by `KeyboardAvoidingView`.

### Navigation
- **Native:** the system tab bar, tinted Forest for the selected item and Secondary Ink for the rest, on Alabaster. It cannot be given a serif label or a rounded cell, so the language is carried by what the platform exposes.
- **Web:** a Paper bar with a 1px Stone top edge. The active cell is a **Clay pill with a Sage Ink label** — the same selection language the segmented control uses, rather than the full-width ink block it used to be.

### Category Mark (signature)
Eighteen categories, no eighteen hues, and a list that still has to be scannable. Each category carries a two-digit index in a 40px Clay squircle, set in the interface face at Sage Ink. The index derives from list order, so it is stable and sortable. The over-budget variant is a Terracotta squircle with an Alabaster index.

### Stat Tile
A figure in a row of figures, with no border and no rule: a `label` eyebrow, an `amount-large` figure, and an optional `caption` hint. A run of tiles is held apart by space alone, which is what stops three numbers reading as three competing cards.

### Summary Row (signature)
The component the density rule is built on. A label, an optional figure, an optional hint, and a chevron — a one-line door to a sheet. It is what lets a screen state a headline and name six kinds of detail without showing any of them.

### Grain
A single full-screen overlay, `assets/images/grain.png`, generated by `tools/generate-grain.mjs`, painted at 3% opacity above the navigator and never intercepting touches. On native it tiles with `resizeMode="repeat"`; on the web it is a repeating CSS background, because React Native Web maps resize modes onto `object-fit`, which has no repeating value.

## Do's and Don'ts

### Do:
- **Do** carry every meaningful distinction with sign, arrow and words first, and let colour reinforce it second.
- **Do** set every monetary figure with tabular numerals, right-aligned in a list.
- **Do** state a figure once per screen. If it can be derived, it does not need printing.
- **Do** reach for a summary row and a sheet before adding a section to a screen.
- **Do** limit a screen to one forest plate.
- **Do** keep the grain on. It is the one thing separating a screen from a sheet.
- **Do** round every corner, and keep the arch for the brand.
- **Do** set at most one word of a headline in italic.
- **Do** make entrances slow and eased, and presses fast and tactile.
- **Do** honour Reduce Motion in every entrance, and keep content visible when it is on.

### Don't:
- **Don't** use colour as the only carrier of a state. No red-only error, no green-only gain.
- **Don't** use Sage or Terracotta as a text colour. Use their Ink variants.
- **Don't** print a percentage that a bar already shows, or a total beside the figures that sum to it.
- **Don't** put more than one forest plate on a screen.
- **Don't** square a corner, or use the arch as a generic container.
- **Don't** use a black shadow. Every level is tinted with Forest.
- **Don't** reintroduce a monospace for figures. Alignment is `tnum`'s job.
- **Don't** use Playfair for body text or Source Sans for a headline. The two voices do not borrow.
- **Don't** animate a count-up. A ledger's figures should be readable the moment they appear.
- **Don't** use a third typeface, a gradient, or a decorative rule.
