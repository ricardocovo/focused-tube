---
description: |
  This workflow generates architecture documentation drafts for the repository.
  It analyzes the current codebase, reads a repo-local prompt pack, and creates
  a GitHub pull request containing architecture documentation updates,
  including Mermaid diagrams when appropriate.

on:
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

network: defaults

tools:
  github:
    lockdown: false
    min-integrity: none

timeout-minutes: 20

steps:
  - name: Checkout repository
    uses: actions/checkout@v4
    with:
      fetch-depth: 0
      persist-credentials: false

  - name: Install repo-metadata-generator pack
    uses: microsoft/apm-action@v1
    with:
      isolated: 'true'
      dependencies: |
        - ricardocovo/agent-primitives/packs/repo-metadata-generator

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-pull-request:
    title-prefix: "[architecture-docs] "
    labels: [documentation, architecture]
    max: 1
    draft: true
    excluded-files: 
      - "github/**"
    fallback-as-issue: false
---

# Architecture Metadata Generator

Your job is to generate high-signal architecture documentation for this repository using the
pre-made prompt pack in `.github/prompts/p1*.md`.

The repository has already been checked out into the current working directory.

## Required process

1. Read the current documentation and the implementation surface needed to document the system accurately.
   At minimum, inspect these files when they exist:
   - `ARCHITECTURE.md`
   - `README.md`
   - `CONFIGURATION.md`
   - `DEPLOYMENT.md`
   - `.github/copilot-instructions.md`
   - workspace `package.json`
   - `client/package.json`
   - `server/package.json`
   - relevant files under `client/src/`
   - relevant files under `server/src/`
   - relevant files under `specs/`

2. List all the prompts you found under `.github/prompts/p1*.md`.

3. Use sub-agents to run each one of the prompts under `.github/prompts/p1*.md` in parallel.
