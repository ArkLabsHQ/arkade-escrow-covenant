---
name: Escrow
description: A counter rail of Arkade escrows. Release is the only filled action.
colors:
  paper: "#e4eee6"
  ticket: "#f7faf7"
  ink: "#132018"
  green: "#0c6a42"
  deep: "#0a3d28"
  pale: "#e7f6ee"
  line: "#8eae9a"
  fault: "#6e2c28"
  status-on-open: "#b7e4cc"
typography:
  body:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.03em"
  ticket-amount:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.03em"
rounded:
  sm: "2px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-release:
    backgroundColor: "{colors.green}"
    textColor: "{colors.pale}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 0.9rem"
  button-release-disabled:
    backgroundColor: "#c5ddd0"
    textColor: "#1d3b2c"
    rounded: "{rounded.sm}"
    padding: "0.6rem 0.9rem"
  button-refund:
    backgroundColor: "{colors.ticket}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.75rem"
  ticket-open:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.pale}"
    rounded: "{rounded.sm}"
    padding: "0px"
---

## Overview

The page is a dispensary-style ticket rail for Arkade escrows. Each contract is one ticket. The open ticket inverts to deep green and carries Release and Refund. Unroll, the unilateral exit, and keys stay in Advanced.

## Colors

Paper is the page. Ticket stock is the form and the closed tickets. Green is only for Release, the status word, and focus. Fault red is only the torn seam when the compiled address does not match.

## Typography

One system sans. Amounts use tabular numbers. Addresses and the log use monospace. The status word does not grow.

## Layout

A header with the title and the network select. An empty browser shows two choice tickets, with opening an existing address first. A browser with escrows shows text actions and the rail. The open ticket sits under the rail. The page measures about 38rem.

## Elevation & Depth

No shadows. The open ticket steps down 2px. Motion is 180ms and turns off when the user prefers reduced motion.

## Shapes

2px corners. A dashed perforation separates the amount stub from the status.

## Components

Release is filled green and depresses while the spend runs. Refund and Advanced actions are outlines. A ticket button is the row. The backup note is a dashed rule and a sentence on the open ticket until the file has been saved. A parameter mismatch tears the top edge and prints both addresses.

## Do's and Don'ts

Do keep Release as the only filled action. Do teach the file backup on the open ticket, not in a modal. Don't put unroll, exit, or keys on the first screen. Don't use a second accent for status.
