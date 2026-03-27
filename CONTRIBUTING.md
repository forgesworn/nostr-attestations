# Contributing

## Setup

```bash
git clone git@github.com:forgesworn/nostr-attestations.git
cd nostr-attestations
npm ci
```

## Development

```bash
npm test          # run tests
npm run test:watch # watch mode
npm run typecheck  # type-check
npm run lint       # lint
npm run build      # compile to dist/
```

## Workflow

1. Create a branch from `feat/initial` (or `main` once released)
2. Write a failing test first, then implement
3. Commit with `type: description` format (`feat:`, `fix:`, `test:`, `docs:`, `chore:`)
4. Open a PR

## Conventions

- **British English** everywhere
- **Zero runtime dependencies** — this library does pure data transformation
- **ESM-only** — `"type": "module"`
- Do not add Co-Authored-By lines to commits

## Test Vectors

The 20 vectors in `vectors/attestations.json` are frozen. Do not modify existing vectors. New vectors may be added for new features.
