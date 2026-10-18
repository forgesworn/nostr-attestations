# nostr-attestations

[![npm](https://img.shields.io/npm/v/nostr-attestations)](https://www.npmjs.com/package/nostr-attestations)
[![CI](https://github.com/forgesworn/nostr-attestations/actions/workflows/ci.yml/badge.svg)](https://github.com/forgesworn/nostr-attestations/actions/workflows/ci.yml)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/TheCryptoDonkey?logo=githubsponsors&color=ea4aaa&label=Sponsor)](https://github.com/sponsors/TheCryptoDonkey)

One Nostr event kind for all attestations -- credentials, endorsements, vouches, provenance, and licensing. Supports both direct attestation and assertion-first patterns within a single kind.

**Nostr:** [`npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`](https://njump.me/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

## Install

```
npm install nostr-attestations
```

ESM-only: use `import` (there is no CommonJS build). `engines` declares Node.js >=22. There are no runtime dependencies.

## Quick Start

```typescript
import { createAttestation, isValid, TYPES } from 'nostr-attestations'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'

const secretKey = generateSecretKey()              // the attestor's key; load your own in practice
const subject = getPublicKey(generateSecretKey())  // hex pubkey of who the attestation is about
const now = Math.floor(Date.now() / 1000)

// Create an unsigned attestation event template
const template = createAttestation({
  type: TYPES.CREDENTIAL,
  identifier: 'attorney-licence-ny',     // d-tag segment: names this attestation (not the subject)
  subject,                               // p-tag: who the attestation is about
  summary: 'Professional credential verified',
  expiration: now + 365 * 24 * 60 * 60,  // one year from now, in unix seconds
  tags: [['profession', 'attorney'], ['jurisdiction', 'US-NY']],
  content: JSON.stringify({ proof: '...' }),
})
// => { kind: 31000, tags: [...], content: '...' }  (no created_at, pubkey, id or sig)

// Sign. The template leaves created_at unset and nostr-tools requires it, so add it here.
const event = finalizeEvent({ ...template, created_at: now }, secretKey)
isValid(event) // { valid: true }

// Publish
const pool = new SimplePool()
await Promise.all(pool.publish(['wss://relay.example.com'], event))
pool.close(['wss://relay.example.com'])
```

This library has no relay client, no signing library and no crypto. nostr-tools above is one choice: bring any Nostr SDK, or bare WebSocket code. Every pubkey and event ID you pass in must be 64 lowercase hex characters, or the builders throw.

`identifier` is optional for direct claims. When omitted it defaults to `subject`, so the d-tag becomes `credential:<subject>` and one publisher holds one attestation of that type per subject. Set a distinct `identifier`, as above, when one publisher may issue several attestations of a type about the same subject. `createAttestation` throws if both are missing.

### Assertion-First Pattern

Attest to someone else's claim: the individual makes an assertion, you verify it.

```typescript
import { createAttestation } from 'nostr-attestations'

// Placeholders: use the real pubkey and event ID (64 lowercase hex characters)
const subject = 'a'.repeat(64)      // pubkey of the person who made the assertion
const assertionId = 'b'.repeat(64)  // ID of their assertion event

const template = createAttestation({
  assertion: { id: assertionId, relay: 'wss://relay.example.com' },
  subject,
  content: 'Identity verified in person',
})
// d-tag is assertion:<assertionId>; no type tag and no type label are written
```

Nothing is inferred from the referenced event. No `type` tag is written, the d-tag is `assertion:<ref>`, and parsers report `type` as `'assertion'` (`TYPES.ASSERTION`, a reserved value you cannot pass as `type`). Fetch the referenced event to see what was asserted. Give `assertion` exactly one of `id` or `address` (an addressable coordinate, `kind:pubkey:d-tag`). Pass `type` as well for a hybrid attestation: it adds the `type` tag and the `l` label, and the d-tag stays `assertion:<ref>`.

### Temporal Context

Record when the attested event actually happened, separate from when the attestation was published:

```typescript
import { createAttestation, TYPES } from 'nostr-attestations'

const subject = 'a'.repeat(64)  // placeholder: hex pubkey of the service provider
const now = Math.floor(Date.now() / 1000)

const template = createAttestation({
  type: TYPES.ENDORSEMENT,
  subject,                             // identifier omitted: d-tag is endorsement:<subject>
  occurredAt: now - 2 * 24 * 60 * 60,  // service completed two days ago
  summary: 'Completed frontend work ahead of schedule',
})
// occurred_at tag = when it happened; created_at (set when you sign) = when it was published
```

### NIP-32 Labels

All attestations include [NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md) labels for relay-side discoverability. Typed attestations (those with a `type`) also include a type label:

```json
["L", "attestation"]
["l", "credential", "attestation"]
```

This enables queries like `{"#L": ["attestation"]}` (all attestations) or `{"#l": ["credential"]}` (by type). Assertion-only attestations have no `type`, so they carry the `L` label but no `l` label: query them with `#L`, not `#l`.

## Why This?

Nostr has several ways to label or badge identities, but none designed for verifiable attestations. [NIP-58](https://github.com/nostr-protocol/nips/blob/master/58.md) badges are display-only -- no expiry, no revocation, no structured claims. [NIP-85](https://github.com/nostr-protocol/nips/blob/master/85.md) covers social graph metrics, not arbitrary claims. [NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md) labels are lightweight but not individually replaceable per subject.

nostr-attestations uses **one kind (31000) with a `type` tag** instead of inventing a new event kind for every attestation use case. Credentials, endorsements, vouches, licensing, provenance, and revocations all share the same event structure. New attestation types need zero protocol changes -- just define a new `type` value.

Every attestation is **self-describing** -- the `type` tag and [NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md) labels mean a client can render a meaningful card, and a relay can filter by attestation type, without fetching any referenced events first.

It supports two attestation patterns within the same kind:
- **Direct attestation** -- the attestor defines the type and makes a claim about a subject
- **Assertion-first** -- the subject makes their own claim, and the attestor references and verifies it

The base layer is **semantically neutral** -- it carries attestations but does not interpret them. Flows like attestation requests, trust lists, and attestor discovery belong at the application layer, not in the protocol. Application profiles (identity verification, professional licensing, service reputation) are built downstream, not in the library.


## Revocation

```typescript
import { createRevocation, isRevoked, TYPES } from 'nostr-attestations'
import type { NostrEvent } from 'nostr-attestations'

const subject = 'a'.repeat(64)  // placeholder: the subject of the original attestation
const now = Math.floor(Date.now() / 1000)

// Revoke a previously issued attestation: type, identifier and subject match the original.
// Unlike createAttestation, identifier is required here and does not default to subject.
const revocation = createRevocation({
  type: TYPES.CREDENTIAL,
  identifier: 'attorney-licence-ny',
  subject,
  reason: 'licence-expired',
  effective: now,
})
// Sign it with the original attestor's key and publish: addressable event semantics
// (same pubkey, kind and d-tag) replace the original.

// Revoke an assertion-first attestation: pass the assertion reference, not type + identifier
const assertionRevocation = createRevocation({
  assertionId: 'b'.repeat(64),  // placeholder: the assertion event ID used when attesting
  reason: 'withdrawn-by-subject',
})

// Check whether a signed event fetched from a relay is revoked
declare const event: NostrEvent
const revoked = isRevoked(event) // true if the ["status", "revoked"] tag is present
```

A hybrid attestation (`type` plus `assertion`) has the d-tag `assertion:<ref>`, so revoke it with `assertionId` or `assertionAddress` only. If you pass both `type` + `identifier` and an assertion reference, the typed form wins and the reference is ignored.

## Parsing

```typescript
import { parseAttestation } from 'nostr-attestations'
import type { NostrEvent } from 'nostr-attestations'

declare const event: NostrEvent // a signed event, e.g. the Quick Start event or one fetched from a relay

const attestation = parseAttestation(event) // returns null for non-attestation events
if (!attestation) throw new Error('Not a valid attestation')
// For the Quick Start event:
// {
//   kind: 31000,
//   type: 'credential',              // 'assertion' for assertion-only attestations
//   pubkey: '<attestor-pubkey>',     // event.pubkey
//   createdAt: <event.created_at>,
//   identifier: 'attorney-licence-ny', // null if the d-tag has no colon
//   subject: '<subject-pubkey>',
//   assertionId: null,               // event ID if assertion-first
//   assertionAddress: null,          // addressable coord if assertion-first
//   assertionRelay: null,            // relay hint for assertion
//   summary: 'Professional credential verified',
//   expiration: <unix seconds>,      // expiration tag
//   validFrom: null,                 // valid_from tag
//   validTo: null,                   // valid_to tag: validity window end
//   request: null,                   // what prompted this attestation
//   schema: null,                    // machine-readable schema URI
//   occurredAt: null,                // when the attested event happened
//   revoked: false,
//   reason: null,
//   tags: [...],
//   content: '...',
// }
```

Absent optional tags parse to `null`. Parsing does not verify the signature.

## Validation

```typescript
import { validateAttestation, isValid } from 'nostr-attestations'
import type { NostrEvent } from 'nostr-attestations'

declare const event: NostrEvent // a signed event, e.g. the Quick Start event or one fetched from a relay

// Structural correctness (d-tag, type, assertion refs, hex pubkeys, etc.)
const result = validateAttestation(event)
if (!result.valid) console.error(result.errors)

// Temporal validity (revocation, expiration, validity window)
const validity = isValid(event) // optional second argument: unix seconds to check against
if (!validity.valid) console.warn(validity.reason)
```

Neither function verifies signatures. `isValid` checks four things in this order and returns the first that fails:

| `reason` | Tag | Fails when |
|----------|-----|------------|
| `'revoked'` | `status` is `revoked` | always checked first |
| `'expired'` | `expiration` (NIP-40) | `now >= expiration` |
| `'not-yet-active'` | `valid_from` | `now < valid_from` |
| `'claim-expired'` | `valid_to` | `now >= valid_to` |

`expiration` is the NIP-40 expiry that relays may enforce. `valid_to` is an application-level end of the claim window, so an event past both reports `'expired'`. The builders write `valid_from` and `valid_to` from `validFrom` and `validTo`. A tag that is not a finite number is ignored.

## API Reference

### Builders

| Function | Signature | Returns |
|----------|-----------|---------|
| `createAttestation` | `(params: AttestationParams) => EventTemplate` | Unsigned attestation event |
| `createRevocation` | `(params: RevocationParams) => EventTemplate` | Unsigned revocation event |

Both return `{ kind: 31000, tags, content }` with no `created_at`, `pubkey`, `id` or `sig`. Add `created_at` when you sign, because signers such as nostr-tools `finalizeEvent` require it.

#### `AttestationParams`

At least one of `type` or `assertion` is required. Every error below is thrown as an `Error` by `createAttestation`.

| Field | Type | Required | Tag written | Notes |
|-------|------|----------|-------------|-------|
| `type` | `string` | one of `type` or `assertion` | `type`, and the `l` label | Must not contain a colon or equal `"assertion"`. An empty string counts as absent. |
| `identifier` | `string` | no | `d` as `<type>:<identifier>` | Defaults to `subject` for direct claims; throws if both are missing. Ignored when `assertion` is given. |
| `subject` | `string` | no | `p` | 64 lowercase hex characters, or throws. |
| `assertion` | `AssertionRef` | one of `type` or `assertion` | `d` as `assertion:<ref>`, plus `e` or `a` | Exactly one of `id` (64 lowercase hex, or throws) or `address`. `relay` fills the tag's relay slot (empty string if omitted); the fourth element is `"assertion"`. |
| `summary` | `string` | no | `summary` | Omitted if empty. |
| `expiration` | `number` | no | `expiration` | Unix seconds (NIP-40). Throws if not finite. |
| `validFrom` | `number` | no | `valid_from` | Unix seconds. Throws if not finite. |
| `validTo` | `number` | no | `valid_to` | Unix seconds. Throws if not finite or not greater than `validFrom`. |
| `request` | `string` | no | `request` | Opaque reference to what prompted this, conventionally an addressable coordinate. Omitted if empty. |
| `schema` | `string` | no | `schema` | Machine-readable schema URI. Throws if empty or whitespace. |
| `occurredAt` | `number` | no | `occurred_at` | Unix seconds when the attested event happened. Throws if not finite. |
| `tags` | `string[][]` | no | appended as given | Throws if a tag name is `d`, `type`, `status`, `L` or `l`. |
| `content` | `string` | no | event content | Defaults to `''`. |

The `L` label is always written; the `l` label only when `type` is given.

#### `RevocationParams`

Provide `type` + `identifier` for a typed attestation, or `assertionId` / `assertionAddress` for an assertion-first one. The result always carries `["status", "revoked"]` and empty content. Publish it with the original attestor's key.

| Field | Type | Required | Tag written | Notes |
|-------|------|----------|-------------|-------|
| `type` | `string` | typed attestations, with `identifier` | `type`, and `d` | Must not equal `"assertion"`. |
| `identifier` | `string` | typed attestations, with `type` | `d` as `<type>:<identifier>` | Must equal the original d-tag segment. No fallback to `subject`. |
| `subject` | `string` | no | `p` | Include it if the original had one. 64 lowercase hex, or throws. |
| `assertionId` | `string` | assertion-first, one of the two | `d` as `assertion:<id>` | Throws if combined with `assertionAddress`. |
| `assertionAddress` | `string` | assertion-first, one of the two | `d` as `assertion:<address>` | |
| `reason` | `string` | no | `reason` | Omitted if empty. |
| `effective` | `number` | no | `effective` | Unix seconds. Throws if not finite. |

It also throws when neither `type` + `identifier` nor an assertion reference is given.

### Parsers

| Function | Signature | Returns |
|----------|-----------|---------|
| `parseAttestation` | `(event: NostrEvent) => Attestation \| null` | Typed attestation data, or `null` for non-attestation events |
| `isRevoked` | `(event: NostrEvent) => boolean` | True if event has `["status", "revoked"]` |

### Validators

| Function | Signature | Returns |
|----------|-----------|---------|
| `validateAttestation` | `(event: NostrEvent) => ValidationResult` | `{ valid: boolean, errors: string[] }` |

### Validity

| Function | Signature | Returns |
|----------|-----------|---------|
| `isValid` | `(event: NostrEvent, now?: number) => ValidityResult` | `{ valid: boolean, reason?: 'revoked' \| 'expired' \| 'not-yet-active' \| 'claim-expired' }` |

### Filters

| Function | Signature | Returns |
|----------|-----------|---------|
| `attestationFilter` | `(params: FilterParams) => NostrFilter` | Relay query filter |
| `revocationFilter` | `(type: string, identifier: string)` or `({ assertionId?, assertionAddress? })` | Filter for the latest version of one attestation |
| `buildDTag` | `(type: string, identifier: string) => string` | `"type:identifier"` string |
| `buildAssertionDTag` | `(ref: string) => string` | `"assertion:ref"` string |
| `parseDTag` | `(dTag: string) => { type: string; identifier: string } \| null` | Parsed d-tag (type is `"assertion"` for assertion-only) |

#### `FilterParams`

All fields are optional and nothing throws. The filter always has `kinds: [31000]`.

| Field | Type | Filter key | Notes |
|-------|------|------------|-------|
| `type` | `string` | `#l` | Not `#type`. Assertion-only attestations have no `l` label, so this never matches them. |
| `subject` | `string` | `#p` | |
| `authors` | `string[]` | `authors` | Ignored if empty. |
| `schema` | `string` | `#schema` | NIP-01 defines tag filters for single-letter tags, so a relay may ignore this one: also check `parseAttestation(event).schema` client-side. |

```typescript
import { attestationFilter, revocationFilter, TYPES } from 'nostr-attestations'

const attestor = 'a'.repeat(64)  // placeholder hex pubkeys
const subject = 'b'.repeat(64)

attestationFilter({ type: TYPES.CREDENTIAL, subject, authors: [attestor] })
// => { kinds: [31000], authors: [attestor], '#p': [subject], '#l': ['credential'] }

// Latest version of one attestation. d-tags are only unique per publisher, so add authors yourself.
const check = { ...revocationFilter(TYPES.CREDENTIAL, 'attorney-licence-ny'), authors: [attestor] }
// => { kinds: [31000], '#d': ['credential:attorney-licence-ny'], authors: [attestor] }

revocationFilter({ assertionId: 'c'.repeat(64) })
// => { kinds: [31000], '#d': ['assertion:cccc...'] } (the full 64-character ID)
```

### Constants

| Export | Value | Description |
|--------|-------|-------------|
| `ATTESTATION_KIND` | `31000` | NIP-VA event kind |
| `TYPES` | `{ CREDENTIAL, ENDORSEMENT, VOUCH, VERIFIER, PROVENANCE, ASSERTION }` | Type constants. `ASSERTION` (`'assertion'`) is reserved: parsers report it for assertion-only attestations and builders reject it as a `type`. |

### Types

`AssertionRef`, `AttestationParams`, `RevocationParams`, `Attestation`, `ValidationResult`, `ValidityResult`, `FilterParams`, `NostrFilter`, `NostrEvent`, `EventTemplate` -- all exported from the package root and from `nostr-attestations/types` (zero-runtime import).

## Upgrading from 1.x or 2.x

Full history is in [CHANGELOG.md](./CHANGELOG.md). Changes that break code or queries written against earlier versions:

- 3.0: the NIP-32 label namespace is `attestation`, where earlier versions wrote `nip-va`. Events carry `["L", "attestation"]` and `["l", "<type>", "attestation"]`. Update any `#L` or `#l` relay filters; events indexed under the old label are not found by the new one.
- 2.5.2: `attestationFilter({ type })` filters on `#l`, not `#type`. `NostrFilter` has `#l` and `#schema`, and no `#type`.
- 2.3.1: `createAttestation` and `createRevocation` throw unless `subject` is 64 lowercase hex, `createAttestation` throws unless `assertion.id` is, and `tags` may not use the reserved names `d`, `type`, `status`, `L` or `l`.
- 2.2: `"assertion"` is a reserved type value. `isValid` was added.
- 2.0: `type` is optional on `AttestationParams`, `RevocationParams` takes `assertionId` or `assertionAddress`, and `parseAttestation` returns `type: 'assertion'` for assertion-only attestations. Added `assertion`, `validTo`, `request` and `schema` params, `buildAssertionDTag`, and the `nostr-attestations/types` subpath. (The 2.0.0 changelog entry says `Attestation.type` became `string | null`. It did not: it stayed `string`.)

## Test Vectors

`vectors/attestations.json` contains 20 frozen conformance test vectors covering the full range of attestation types (credential, endorsement, vouch, verifier, provenance) and states (active, revoked, self-attestation). Any conformant implementation must produce identical parse results from these inputs. The vectors are pinned -- if tests against them fail, the implementation is broken, not the vector.

## Attested on Nostr

This library's authorship is claimed on Nostr using the very protocol it implements -- NIP-VA eating its own dog food.

A self-attestation alone only proves that the holder of a private key *claims* authorship -- not that the claim is true. The real value comes from **third-party attestations**: other pubkeys independently publishing `type: endorsement` events that reference this repo.

But counting endorsements isn't enough either -- anyone can create 50 throwaway npubs and endorse themselves. What matters is **who** endorses, not how many. A single endorsement from a pubkey with a verified NIP-05 domain, a history of notes, and followers you recognise is worth more than a thousand from anonymous keys. This is a web of trust, not a vote count. When verifying, ask: do I know this endorser? Do people I trust follow them? That's how you resist Sybil attacks without a centralised authority.

All verification uses [nak](https://github.com/fiatjaf/nak) (the Nostr Army Knife). Install with `go install github.com/fiatjaf/nak@latest` or `brew install fiatjaf/tap/nak`.

**1. GitHub → Nostr** -- this README claims `npub1mgv...` (see header above)

**2. Nostr → GitHub** -- the repo announcement points back here:

```bash
nak req -k 30617 \
  -a $(nak decode npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2) \
  -d nostr-attestations \
  wss://relay.damus.io
# Look for the "web" tag → github.com/forgesworn/nostr-attestations
```

**3. Verify the authorship claim** -- signed by the same key:

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
  -t a=30617:da19f1cd34beca44be74da4b306d9d1dd86b6343cef94ce22c49c6f59816e5bd:nostr-attestations \
  wss://relay.damus.io
# Returns all attestations referencing this repo -- filter by pubkey or type client-side
```

Same npub on both sides -- you'd need to control both GitHub and the private key to fake it. Third-party endorsements add independent signatures that can't be faked by one person.

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

## Part of the ForgeSworn Toolkit

[ForgeSworn](https://forgesworn.dev) builds open-source cryptographic identity, payments, and coordination tools for Nostr.

| Library | What it does |
|---------|-------------|
| [nsec-tree](https://github.com/forgesworn/nsec-tree) | Deterministic sub-identity derivation |
| [ring-sig](https://github.com/forgesworn/ring-sig) | SAG/LSAG ring signatures on secp256k1 |
| [range-proof](https://github.com/forgesworn/range-proof) | Pedersen commitment range proofs |
| [canary-kit](https://github.com/forgesworn/canary-kit) | Coercion-resistant spoken verification |
| [spoken-token](https://github.com/forgesworn/spoken-token) | Human-speakable verification tokens |
| [toll-booth](https://github.com/forgesworn/toll-booth) | L402 payment middleware |
| [geohash-kit](https://github.com/forgesworn/geohash-kit) | Geohash toolkit with polygon coverage |
| [nostr-attestations](https://github.com/forgesworn/nostr-attestations) | NIP-VA verifiable attestations |
| [dominion](https://github.com/forgesworn/dominion) | Epoch-based encrypted access control |
| [nostr-veil](https://github.com/forgesworn/nostr-veil) | Privacy-preserving Web of Trust |

## Licence

MIT
