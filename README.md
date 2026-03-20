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

## Why This?

Nostr has several ways to label or badge identities, but none designed for verifiable attestations. [NIP-58](https://github.com/nostr-protocol/nips/blob/master/58.md) badges are display-only — no expiry, no revocation, no structured claims. [NIP-85](https://github.com/nostr-protocol/nips/blob/master/85.md) covers social graph metrics, not arbitrary claims. [NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md) labels are lightweight but not individually replaceable per subject.

nostr-attestations uses **one kind (31000) with a `type` tag** instead of inventing a new event kind for every attestation use case. Credentials, endorsements, vouches, licensing, provenance, and revocations all share the same event structure. New attestation types need zero protocol changes — just define a new `type` value.

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
const revoked = isRevoked(event) // true if ["status", "revoked"] tag present
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
| `isRevoked` | `(event: NostrEvent) => boolean` | True if event has `["status", "revoked"]` |

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
| `TYPES` | `{ CREDENTIAL, ENDORSEMENT, VOUCH, VERIFIER, PROVENANCE }` | Well-known type constants |

### Types

`AttestationParams`, `RevocationParams`, `Attestation`, `ValidationResult`, `FilterParams`, `NostrFilter`, `NostrEvent`, `EventTemplate` — all exported from the package root.

## Test Vectors

`vectors/attestations.json` contains 10 frozen conformance test vectors covering the full range of attestation types (credential, endorsement, vouch, verifier, provenance) and states (active, revoked, self-attestation). Any conformant implementation must produce identical parse results from these inputs. The vectors are pinned — if tests against them fail, the implementation is broken, not the vector.

## Attested on Nostr

This library's authorship is attested on Nostr using the very protocol it implements — NIP-VA eating its own dog food.

**Verify with [nak](https://github.com/fiatjaf/nak):**

```bash
nak req -k 31000 \
  -a da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd \
  -t d=authorship:nostr-attestations \
  wss://relay.damus.io | nak verify
```

**Or query the raw attestation:**

```bash
nak req -k 31000 \
  -a da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd \
  -t d=authorship:nostr-attestations \
  wss://relay.damus.io
```

The attestation is a kind 31000 event signed by [`npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`](https://njump.me/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2) with an `a` tag binding it to the repository announcement. No centralised authority — just a Nostr keypair, a signature, and a relay.

## NIP-VA

Full protocol specification: [NIP-VA.md](./NIP-VA.md) | [NostrHub](https://nostrhub.io/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

## Licence

MIT
