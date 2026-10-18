# AGENTS.md: nostr-attestations

Instructions in this file apply to the entire repository.

## Project Summary

Zero-dependency TypeScript library for NIP-VA (kind 31000) Verifiable Attestation events on Nostr. Provides builders, parsers, validators, and filters for creating and consuming attestation events. ESM-only. TypeScript native. Pure data transformation: no network I/O, no signing. Node.js >=22 is declared in `engines` (CI runs Node 24).

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Install dependencies |
| `npm run build` | Compile TypeScript to dist/ |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

## Repository Structure

```
src/
  constants.ts     : ATTESTATION_KIND (31000), TYPES (including the reserved ASSERTION)
  types.ts         : all type definitions (AttestationParams, Attestation, NostrEvent, etc.)
  helpers.ts       : internal helpers (findTag), not part of public API
  builders.ts      : createAttestation, createRevocation; return unsigned EventTemplate
  parsers.ts       : parseAttestation, isRevoked; extract typed data from NostrEvent
  validators.ts    : validateAttestation, structural correctness checks
  filters.ts       : buildDTag, buildAssertionDTag, parseDTag, attestationFilter, revocationFilter
  validity.ts      : isValid, ValidityResult (revocation, expiration, valid_from, valid_to)
  index.ts         : barrel exports
test/              : vitest tests (166 tests across 6 files)
vectors/
  attestations.json: 20 frozen conformance test vectors
```

## Coding Conventions

- **British English**: colour, initialise, behaviour, licence
- **ESM-only**: `"type": "module"` in package.json
- **Zero runtime dependencies**: pure data transformation; no external packages at runtime
- **TDD**: write a failing test first, then implement
- **Input validation**: public APIs validate inputs; `validateAttestation` returns structured errors

## Working Guidelines

- `identifier` is the d-tag second segment (any string naming the attestation). `subject` is the p-tag (hex pubkey of who the attestation is about). They are distinct concepts; do not conflate them.
- For direct claims `createAttestation` falls back to `subject` when `identifier` is omitted, and throws if both are missing. `createRevocation` has no such fallback: it needs `type` + `identifier`, or `assertionId` / `assertionAddress`. Hybrid attestations (type plus assertion) use the `assertion:<ref>` d-tag, so revoke them by assertion reference.
- The d-tag is unique per publisher per type per identifier, not per subject. Docs must not say "per subject" unless identifier defaults to subject.
- Assertion-only attestations get no `type` tag and no `l` label. Nothing is inferred from the referenced event; `parseAttestation` and `parseDTag` report type `"assertion"` (`TYPES.ASSERTION`, reserved).
- `isValid` order: `revoked`, then `expired` (`expiration`), `not-yet-active` (`valid_from`), `claim-expired` (`valid_to`).
- Builders require 64 lowercase hex for `subject` and `assertion.id`; doc examples must use real-looking hex, not `<placeholder>` strings, and timestamps relative to `Date.now()`.
- The first colon in the d-tag is the delimiter. Type values must NOT contain colons.
- `parseDTag()` returns `null` for malformed d-tags, not an error. Callers must handle the `null` case.
- `EventTemplate` has optional `created_at`; signing libraries set this at sign time. Do not require it in builders.
- Revocation uses `["status", "revoked"]` (multi-letter tag) to avoid claiming a single-letter indexed tag.
- `Attestation` (parsed type) includes `pubkey` and `createdAt` from the outer event.
- The NIP-32 discoverability label namespace is `attestation` (the `L` tag value and the third element of the `l` tag), not `nip-va`.
- Filtering by attestation type uses the `#l` relay filter, not `#type`.
- Test vectors in `vectors/attestations.json` are frozen; do not modify them. Add new vectors for new features.

## Release Notes

Automated via [forgesworn/anvil](https://github.com/forgesworn/anvil): `auto-release.yml` reads conventional commits on push to `main`, bumps the version and creates a GitHub Release; `release.yml` then runs the pre-publish gates and publishes to npm via OIDC trusted publishing. Work on branches; merge to main only when a logical chunk is complete to avoid version spam.

| Commit prefix | Version bump |
|---------------|--------------|
| `fix:` | Patch (1.0.x) |
| `feat:` | Minor (1.x.0) |
| `BREAKING CHANGE:` (in body) | Major (x.0.0) |
| `chore:`, `docs:`, `refactor:` | None |

Tests must pass before release.

Do NOT include `Co-Authored-By` lines in commits.
