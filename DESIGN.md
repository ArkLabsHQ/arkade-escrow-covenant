---
name: Escrow
description: A grid of saved escrows. Create and load are dialogs.
colors:
  paper: "#e4eee6"
  ticket: "#f7faf7"
  ink: "#132018"
  green: "#0c6a42"
  deep: "#0a3d28"
  pale: "#e7f6ee"
  line: "#8eae9a"
  fault: "#6e2c28"
typography:
  body:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.03em"
  amount:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.03em"
rounded:
  sm: "2px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.pale}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.7rem"
  ticket:
    backgroundColor: "{colors.ticket}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.9rem"
---

## Overview

The page is a grid of escrow tiles on cool paper. An empty browser shows New escrow and Load an address, and nothing else. Both open a dialog. Opening a tile opens the dialog that holds Release and Refund.

## Colors

Green is the primary action and the status word. Deep green is the selected tile and the selected amount. Fault red is only a parameter mismatch.

## Typography

One system sans. Amounts are tabular.

## Layout

The grid uses auto-fill columns of at least 16rem. Dialogs are at most 32rem. Buyer and seller are separate fieldsets.

## Elevation & Depth

Dialogs sit on a deep-green backdrop. Tiles have no shadow.

## Shapes

2px corners. Fieldsets use a dashed line.

## Components

Amount choices are 1,000, 5,000, 10,000, and 50,000, plus Custom. The pressed choice is deep green. Release is the filled action in the escrow dialog. Advanced is collapsed.

## Do's and Don'ts

Do keep the form off the first screen. Do put Release and Refund on the opened escrow. Don't show unroll or keys until Advanced is opened.
