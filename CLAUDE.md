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

## Release & Versioning

**Automated via semantic-release** — version bumps and npm publishing happen automatically when you push to `main`.

| Type | Version Bump |
|------|--------------|
| `fix:` | Patch (1.0.x) |
| `feat:` | Minor (1.x.0) |
| `BREAKING CHANGE:` (in commit body) | Major (x.0.0) |
| `chore:`, `docs:`, `refactor:` | None |

Tests must pass before release. GitHub Actions uses OIDC trusted publishing. **Work on branches** — merge to main only when a logical chunk is complete to avoid version spam.
