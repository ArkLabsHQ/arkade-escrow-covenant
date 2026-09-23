---
name: Escrow
description: A list of saved escrows. Create, load, and payout happen in sheets.
colors:
  canvas: "#f5f5f7"
  sheet: "#ffffff"
  ink: "#1d1d1f"
  secondary: "#6e6e73"
  fill: "#f2f2f7"
  link: "#007aff"
  fault: "#9f2d2a"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
rounded:
  sheet: "16px"
  control: "12px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "16px"
---

## Overview

The page is a list of escrow cards on a grouped gray canvas. An empty browser shows a short explanation, New escrow, and Load an address. Both open a sheet. Opening a card opens the sheet that holds Release and Refund.

## Colors

Ink is the primary action. Secondary gray is for labels and hints. Blue is only for Copy and Close. Fault red is only a parameter mismatch. Green is only a funded status.

## Typography

The system font. Large titles and amounts use tight tracking. Body text stays at zero tracking. Amounts are tabular.

## Layout

Cards wrap from 240px. Sheets are at most 26.5rem and become a bottom sheet under 640px. Buyer and seller stay in separate groups. Read the amount and the refund sentence before the pay-out buttons. On Bitcoin, Keys, and Activity stay under Advanced, one open at a time.

## Elevation & Depth

The sheet is a white surface on a dimmed, blurred backdrop. Cards have a hairline, not a drop shadow.

## Shapes

16px sheets and cards. 12px buttons and fields. Amount choices are pills.

## Components

Dialogs and the amount toggle come from Base UI. Copy, create, release, and errors use Sonner. Amount choices are 1,000, 5,000, 10,000, and 50,000, plus Custom. Release is the filled action. Advanced starts collapsed.

## Do's and Don'ts

Do keep the form off the first screen. Do shorten addresses and copy the full value. Don't show unroll or keys until Advanced is opened.
