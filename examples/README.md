# nostr-attestations — Examples

Runnable examples demonstrating the full API surface.

## Prerequisites

```bash
npm install nostr-attestations
npm install -D tsx        # TypeScript runner for examples
```

## Examples

### basic-attestation.ts

Demonstrates the complete lifecycle:

1. Creating a typed attestation (`TYPES.CREDENTIAL`)
2. Validating structural correctness before signing
3. Parsing a signed event into a typed `Attestation`
4. Checking the validity window with `isValid()`
5. Checking revocation status with `isRevoked()`
6. Creating a revocation event
7. Building relay query filters with `attestationFilter()` and `revocationFilter()`
8. D-tag helpers: `buildDTag()` and `parseDTag()`
9. Endorsement attestation (`TYPES.ENDORSEMENT`)
10. Assertion-only attestation (confirming a first-person claim)

```bash
npx tsx examples/basic-attestation.ts
```

## Key Patterns

### The standard attestation flow

```typescript
import { createAttestation, validateAttestation, TYPES } from 'nostr-attestations'

// 1. Build an unsigned template
const template = createAttestation({
  type: TYPES.CREDENTIAL,
  identifier: subjectPubkey,
  subject: subjectPubkey,
  summary: 'Verified',
})

// 2. Validate before signing (optional but recommended)
const { valid, errors } = validateAttestation({ kind: 31000, ...template, pubkey: '', id: '', sig: '', created_at: 0, tags: template.tags, content: template.content })

// 3. Sign with your preferred Nostr library and publish to relays
```

### Revocation check pattern

```typescript
import { revocationFilter, parseAttestation, isRevoked } from 'nostr-attestations'

// Build a filter to fetch the latest version of a specific attestation
const filter = revocationFilter('credential', subjectPubkey)

// Fetch from relay, then check:
const event = await relay.get(filter)
if (event && isRevoked(event)) {
  // Attestation has been revoked
}
```

### Assertion pattern (third-party confirmation)

```typescript
import { createAttestation } from 'nostr-attestations'

// A third party confirms a subject's self-claim
const confirmation = createAttestation({
  assertion: { id: 'self-claim-event-id', relay: 'wss://relay.example.com' },
  summary: 'Confirmed by independent verifier',
})
```

## See Also

- [llms-full.txt](../llms-full.txt) — complete API reference for AI tools
- [NIP-VA.md](../NIP-VA.md) — full protocol specification
- [vectors/](../vectors/) — 17 frozen conformance test vectors
