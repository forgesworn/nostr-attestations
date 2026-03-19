# nostr-attestations

One Nostr event kind for all attestations — credentials, endorsements, vouches, provenance, licensing, and trust.

## Install

```
npm install nostr-attestations
```

## Quick Start

```typescript
import { createAttestation, TYPES } from 'nostr-attestations'

// Create an unsigned attestation event template
const event = createAttestation({
  type: TYPES.CREDENTIAL,
  identifier: '<subject-pubkey>',
  subject: '<subject-pubkey>',
  summary: 'Professional credential verified',
  expiration: 1735689600,
  tags: [['profession', 'attorney'], ['jurisdiction', 'US-NY']],
  content: JSON.stringify({ proof: '...' }),
})
// => { kind: 31000, tags: [...], content: '...' }
// Sign with your preferred library and publish to relays
```

No relay client, no signing library, no crypto. Bring your own. Works with nostr-tools, any Nostr SDK, or bare WebSocket code.

## Revocation

```typescript
import { createRevocation, isRevoked, parseAttestation } from 'nostr-attestations'

// Revoke a previously issued attestation
const revocation = createRevocation({
  type: 'credential',
  identifier: '<subject-pubkey>',
  subject: '<subject-pubkey>',
  reason: 'licence-expired',
  effective: 1704067200,
})
// Publish — addressable event semantics replace the original

// Check if a fetched event is revoked
const revoked = isRevoked(event) // true if ["s", "revoked"] tag present
```

## Parsing

```typescript
import { parseAttestation } from 'nostr-attestations'

const attestation = parseAttestation(event)
// {
//   kind: 31000,
//   type: 'credential',
//   pubkey: '<attestor-pubkey>',
//   createdAt: 1700000000,
//   identifier: '<subject-pubkey>',
//   subject: '<subject-pubkey>',
//   summary: 'Professional credential verified',
//   expiration: 1735689600,
//   revoked: false,
//   reason: null,
//   tags: [...],
//   content: '...',
// }
```

## API Reference

### Builders

| Function | Signature | Returns |
|----------|-----------|---------|
| `createAttestation` | `(params: AttestationParams) => EventTemplate` | Unsigned attestation event |
| `createRevocation` | `(params: RevocationParams) => EventTemplate` | Unsigned revocation event |

### Parsers

| Function | Signature | Returns |
|----------|-----------|---------|
| `parseAttestation` | `(event: NostrEvent) => Attestation` | Typed attestation data |
| `isRevoked` | `(event: NostrEvent) => boolean` | True if event has `["s", "revoked"]` |

### Validators

| Function | Signature | Returns |
|----------|-----------|---------|
| `validateAttestation` | `(event: NostrEvent) => ValidationResult` | `{ valid: boolean, errors: string[] }` |

### Filters

| Function | Signature | Returns |
|----------|-----------|---------|
| `attestationFilter` | `(params: FilterParams) => NostrFilter` | Relay query filter |
| `revocationFilter` | `(type: string, identifier: string) => NostrFilter` | Revocation check filter |
| `buildDTag` | `(type: string, identifier: string) => string` | `"type:identifier"` string |
| `parseDTag` | `(dTag: string) => { type: string; identifier: string } \| null` | Parsed d-tag |

### Constants

| Export | Value | Description |
|--------|-------|-------------|
| `ATTESTATION_KIND` | `31000` | NIP-VA event kind |
| `TYPES` | `{ CREDENTIAL, ENDORSEMENT, VOUCH, VERIFIER, PROVENANCE }` | Well-known type strings |

### Types

`AttestationParams`, `RevocationParams`, `Attestation`, `ValidationResult`, `FilterParams`, `NostrFilter`, `NostrEvent`, `EventTemplate` — all exported from the package root.

## Test Vectors

`vectors/attestations.json` contains 10 frozen conformance test vectors covering the full range of attestation types (credential, endorsement, vouch, verifier, provenance) and states (active, revoked, self-attestation). Any conformant implementation must produce identical parse results from these inputs. The vectors are pinned — if tests against them fail, the implementation is broken, not the vector.

## NIP-VA

Full protocol specification: [NIP-VA.md](./NIP-VA.md)

## Licence

MIT
