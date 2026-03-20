# nostr-attestations

One Nostr event kind for all attestations — credentials, endorsements, vouches, provenance, licensing, and trust.

**Nostr:** [`npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`](https://njump.me/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

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

A self-attestation alone only proves that the holder of a private key *claims* authorship — not that the claim is true. The real value comes from **third-party attestations**: other pubkeys independently publishing `type: endorsement` events that reference this repo.

But counting endorsements isn't enough either — anyone can create 50 throwaway npubs and endorse themselves. What matters is **who** endorses, not how many. A single endorsement from a pubkey with a verified NIP-05 domain, a history of notes, and followers you recognise is worth more than a thousand from anonymous keys. This is a web of trust, not a vote count. When verifying, ask: do I know this endorser? Do people I trust follow them? That's how you resist Sybil attacks without a centralised authority.

All verification uses [nak](https://github.com/fiatjaf/nak) (the Nostr Army Knife). Install with `go install github.com/fiatjaf/nak@latest` or `brew install fiatjaf/tap/nak`.

**1. GitHub → Nostr** — this README claims `npub1mgv...` (see header above)

**2. Nostr → GitHub** — the repo announcement points back here:

```bash
nak req -k 30617 \
  -a $(nak decode npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2) \
  -d nostr-attestations \
  wss://relay.damus.io
# Look for the "web" tag → github.com/forgesworn/nostr-attestations
```

**3. Verify the authorship claim** — signed by the same key:

```bash
nak req -k 31000 \
  -a $(nak decode npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2) \
  -d authorship:nostr-attestations \
  wss://relay.damus.io 2>/dev/null | nak verify \
  && echo "✓ Signature valid"
```

**4. Check for third-party endorsements:**

```bash
nak req -k 31000 \
  -t type=endorsement \
  -t a=30617:da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd:nostr-attestations \
  wss://relay.damus.io
```

Same npub on both sides — you'd need to control both GitHub and the private key to fake it. Third-party endorsements add independent signatures that can't be faked by one person.

**Endorse it yourself:**

```bash
nak event -k 31000 \
  --prompt-sec \
  -d endorsement:da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd \
  -t type=endorsement \
  -p da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd \
  -t a=30617:da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd:nostr-attestations \
  -t summary="Reviewed and endorsed nostr-attestations" \
  wss://relay.damus.io wss://nos.lol wss://relay.nostr.band
```

## NIP-VA

Full protocol specification: [NIP-VA.md](./NIP-VA.md) | [NostrHub](https://nostrhub.io/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

## Licence

MIT
