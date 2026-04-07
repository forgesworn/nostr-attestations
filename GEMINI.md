# GEMINI.md -- nostr-attestations

Zero-dependency TypeScript library for NIP-VA (kind 31000) Verifiable Attestation events on Nostr.

## Commands

- `npm run build` -- compile TypeScript to dist/
- `npm test` -- run all tests (vitest)
- `npm run typecheck` -- type-check without emitting
- `npm run lint` -- run ESLint

## Structure

```
src/
  constants.ts     -- ATTESTATION_KIND (31000), TYPES, tag name constants
  types.ts         -- all type definitions (AttestationParams, Attestation, NostrEvent, etc.)
  helpers.ts       -- internal helpers (findTag) -- not part of public API
  builders.ts      -- createAttestation, createRevocation -- return unsigned EventTemplate
  parsers.ts       -- parseAttestation, isRevoked -- extract typed data from NostrEvent
  validators.ts    -- validateAttestation -- structural correctness checks
  filters.ts       -- buildDTag, parseDTag, attestationFilter, revocationFilter
  validity.ts      -- validity period helpers
  index.ts         -- barrel exports
test/              -- vitest tests (128 tests across 6 files)
vectors/
  attestations.json -- 20 frozen conformance test vectors
```

## Conventions

- **British English** -- colour, initialise, behaviour, licence
- **ESM-only** -- `"type": "module"` in package.json
- **Zero runtime dependencies** -- pure data transformation
- **TDD** -- write a failing test first, then implement
- **Commit messages** -- `type: description` format (feat:, fix:, docs:, chore:, refactor:). No Co-Authored-By lines.

## Key Patterns / Gotchas

- **d-tag delimiter is the first colon** -- type values must NOT contain colons. `credential:alice` splits as type=`credential`, identifier=`alice`. A type like `x:y` would mis-parse.
- **`identifier` vs `subject`** -- `identifier` is the d-tag second segment (any string, names the attestation). `subject` is the p-tag (hex pubkey of who the attestation is about). Distinct concepts.
- **Revocation** -- re-publish with `["status", "revoked"]` tag. Multi-letter tag avoids claiming a single-letter indexed tag namespace.
- **`EventTemplate` has optional `created_at`** -- signing libraries set this at sign time. Builders must not require it.
- **`parseDTag()` returns `null`** for malformed d-tags, not an error. Callers must handle the `null` case.
- **`Attestation` parsed type** includes `pubkey` and `createdAt` from the outer event -- not present on `EventTemplate`.
- **Test vectors are frozen** -- `vectors/attestations.json` contains 20 conformance vectors. Do not modify them.

## Testing

128 tests across 6 files in `test/`. Run `npm test` before committing. Run `npm run typecheck` to verify types.

## Release

Automated via semantic-release. `feat:` = minor, `fix:` = patch, `BREAKING CHANGE:` in body = major. GitHub Actions with OIDC trusted publishing. Work on branches -- merge to main only when complete.
