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

This library's authorship is claimed on Nostr using the very protocol it implements — NIP-VA eating its own dog food.

A self-attestation alone only proves that the holder of a private key *claims* authorship — not that the claim is true. The real value comes from **third-party attestations**: other pubkeys independently publishing `type: endorsement` events that reference this repo. Each endorsement is an additional signature from a different keypair. Stack enough and you have a web of trust — not one person saying "I made this" but multiple people saying "yes, they made this."

**Verify the authorship claim with [nak](https://github.com/fiatjaf/nak):**

```bash
nak req -q -k 31000 \
  -a $(nak decode npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2) \
  -t d=authorship:nostr-attestations \
  wss://relay.damus.io 2>/dev/null | nak verify \
  && echo "✓ Signature valid"
```

**Query the raw attestation:**

```bash
nak req -q -k 31000 \
  -a $(nak decode npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2) \
  -t d=authorship:nostr-attestations \
  wss://relay.damus.io 2>/dev/null
```

**Endorse it yourself** — publish a kind 31000 `type: endorsement` event referencing this repo's `a` tag. That's how decentralised trust works: no authority, just signatures.

## NIP-VA

Full protocol specification: [NIP-VA.md](./NIP-VA.md) | [NostrHub](https://nostrhub.io/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

## Licence

MIT
