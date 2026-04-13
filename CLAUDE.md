# CLAUDE.md — nostr-attestations

Zero-dependency TypeScript library for NIP-VA (kind 31000) Verifiable Attestation events on Nostr.

## Commands

- `npm run build` — compile TypeScript to dist/
- `npm test` — run vitest
- `npm run test:watch` — run vitest in watch mode
- `npm run typecheck` — type-check without emitting
- `npm run lint` — run ESLint
- `npm run lint:fix` — run ESLint with auto-fix

## Structure

| File | Purpose |
|------|---------|
| `src/constants.ts` | ATTESTATION_KIND (31000), TYPES, tag name constants |
| `src/types.ts` | All type definitions (AttestationParams, Attestation, NostrEvent, etc.) |
| `src/helpers.ts` | Internal helpers (findTag) — not part of public API |
| `src/builders.ts` | createAttestation, createRevocation — return unsigned EventTemplate |
| `src/parsers.ts` | parseAttestation, isRevoked — extract typed data from NostrEvent |
| `src/validators.ts` | validateAttestation — structural correctness checks |
| `src/filters.ts` | buildDTag, parseDTag, attestationFilter, revocationFilter |
| `src/index.ts` | Barrel exports |
| `vectors/attestations.json` | 20 frozen test vectors (conformance suite) |

## Conventions

- **British English** everywhere
- **ESM-only** (`"type": "module"`)
- **Zero runtime dependencies** — pure data transformation
- **TDD** — write failing test first, then implement
- **Commits** — `type: description` format (feat:, fix:, test:, docs:, chore:)
- **Do NOT include Co-Authored-By lines in commits**
- **Branching** — work on branches, merge to main for release

## Key design decisions

- `identifier` = d-tag second segment (any string). `subject` = p-tag (hex pubkey). They are distinct concepts.
- Type values MUST NOT contain colons — first colon in d-tag is the delimiter.
- Revocation = re-publish with `["status", "revoked"]` tag. Multi-letter tag avoids claiming a new single-letter indexed tag.
- `EventTemplate` has optional `created_at` — signing libraries typically set this.
- `Attestation` parsed type includes `pubkey` and `createdAt` from the outer event.

## Gotchas

- **First colon in d-tag is the delimiter** — type values must NOT contain colons. `credential:alice` splits as type=`credential`, identifier=`alice`. A type like `x:y` would mis-parse.
- **`identifier` vs `subject`** — `identifier` is the d-tag second segment (any string, names the attestation). `subject` is the p-tag (hex pubkey of who the attestation is about). They serve different purposes.
- **Revocation uses a multi-letter tag** — `["status", "revoked"]` rather than claiming a single-letter indexed tag. This is intentional to avoid NIP tag-namespace collisions.
- **`EventTemplate` has optional `created_at`** — signing libraries (nostr-tools, etc.) typically set this at sign time. Don't require it in builders.
- **`parseDTag()` returns `null`** for malformed d-tags, not an error. Callers must handle the `null` case.

## Release & Versioning

**Automated via [forgesworn/anvil](https://github.com/forgesworn/anvil)** — `auto-release.yml` reads conventional commits on push to `main`, bumps the version, and creates a GitHub Release; `release.yml` then runs the pre-publish gates and publishes to npm via OIDC trusted publishing.

| Type | Version Bump |
|------|--------------|
| `fix:` | Patch (1.0.x) |
| `feat:` | Minor (1.x.0) |
| `BREAKING CHANGE:` (in commit body) | Major (x.0.0) |
| `chore:`, `docs:`, `refactor:` | None |

Tests must pass before release. **Work on branches** — merge to main only when a logical chunk is complete to avoid version spam.
