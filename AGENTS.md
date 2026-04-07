# AGENTS.md — nostr-attestations

Instructions in this file apply to the entire repository.

## Project Summary

Zero-dependency TypeScript library for NIP-VA (kind 31000) Verifiable Attestation events on Nostr. Provides builders, parsers, validators, and filters for creating and consuming attestation events. ESM-only. TypeScript native. Pure data transformation — no network I/O, no signing.

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to dist/ |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

## Repository Structure

```
src/
  constants.ts     — ATTESTATION_KIND (31000), TYPES, tag name constants
  types.ts         — all type definitions (AttestationParams, Attestation, NostrEvent, etc.)
  helpers.ts       — internal helpers (findTag) — not part of public API
  builders.ts      — createAttestation, createRevocation — return unsigned EventTemplate
  parsers.ts       — parseAttestation, isRevoked — extract typed data from NostrEvent
  validators.ts    — validateAttestation — structural correctness checks
  filters.ts       — buildDTag, parseDTag, attestationFilter, revocationFilter
  validity.ts      — validity period helpers
  index.ts         — barrel exports
test/              — vitest tests (128 tests across 6 files)
vectors/
  attestations.json — 20 frozen conformance test vectors
```

## Coding Conventions

- **British English** — colour, initialise, behaviour, licence
- **ESM-only** — `"type": "module"` in package.json
- **Zero runtime dependencies** — pure data transformation; no external packages at runtime
- **TDD** — write a failing test first, then implement
- **Input validation** — public APIs validate inputs; `validateAttestation` returns structured errors

## Working Guidelines

- `identifier` is the d-tag second segment (any string naming the attestation). `subject` is the p-tag (hex pubkey of who the attestation is about). They are distinct concepts — do not conflate them.
- The first colon in the d-tag is the delimiter. Type values must NOT contain colons.
- `parseDTag()` returns `null` for malformed d-tags, not an error. Callers must handle the `null` case.
- `EventTemplate` has optional `created_at` — signing libraries set this at sign time. Do not require it in builders.
- Revocation uses `["status", "revoked"]` (multi-letter tag) to avoid claiming a single-letter indexed tag.
- `Attestation` (parsed type) includes `pubkey` and `createdAt` from the outer event.
- Test vectors in `vectors/attestations.json` are frozen — do not modify them. Add new vectors for new features.

## Release Notes

Automated via semantic-release. Push to `main` triggers version bump and npm publish via GitHub Actions (OIDC trusted publishing). Work on branches; merge to main only when a logical chunk is complete.

| Commit prefix | Version bump |
|---------------|--------------|
| `fix:` | Patch (1.0.x) |
| `feat:` | Minor (1.x.0) |
| `BREAKING CHANGE:` (in body) | Major (x.0.0) |
| `chore:`, `docs:`, `refactor:` | None |

Do NOT include `Co-Authored-By` lines in commits.
