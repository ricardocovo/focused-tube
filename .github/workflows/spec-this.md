---
on:
  label_command:
    name: spec-this
    events: [issues]

permissions:
  contents: read
  issues: read
  copilot-requests: write

safe-outputs:
  add-comment:
  update-issue:
    target: "${{ github.event.issue.number }}"
    title:

tools:
  github:
    toolsets:
      - issues
---

# Spec This Issue

You are a Senior Software Developer. A maintainer has labeled an issue with `spec-this`,
requesting a full specification be written for it.

## Your Task

Create detail technical specifications based on the content of this issue.

Keep the specification grounded in the actual issue content. Do not invent requirements
that are not implied by the issue. Use precise technical language appropriate for engineers
who will implement this work.

## Results

Use `update_issue` to update issue #${{ github.event.issue.number }} with the new
specification as `body` and `operation: "append"`. *DO NOT delete* any existing
content. In the same call, set `title` to something representative of the changes required.

Add a comment stating you have updated the issue.
