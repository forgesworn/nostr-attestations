/**
 * Basic nostr-attestations usage examples.
 *
 * Run with: npx tsx examples/basic-attestation.ts
 * (Requires nostr-tools for signing — not a runtime dependency of nostr-attestations itself.)
 */

import {
  createAttestation,
  createRevocation,
  parseAttestation,
  validateAttestation,
  isRevoked,
  buildDTag,
  parseDTag,
  attestationFilter,
  revocationFilter,
  isValid,
  TYPES,
  ATTESTATION_KIND,
} from 'nostr-attestations'

// ---------------------------------------------------------------------------
// 1. Create a typed attestation (e.g. a professional credential)
// ---------------------------------------------------------------------------

const subjectPubkey = 'abc123pubkeyhex0000000000000000000000000000000000000000000000000000'

const credentialTemplate = createAttestation({
  type: TYPES.CREDENTIAL,
  identifier: subjectPubkey,
  subject: subjectPubkey,
  summary: 'Solicitor — England & Wales',
  expiration: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,  // 1 year
  validFrom: Math.floor(Date.now() / 1000),
  schema: 'https://trott.io/schemas/credential/solicitor-v1',
  tags: [
    ['profession', 'solicitor'],
    ['jurisdiction', 'GB-ENG'],
    ['registration', 'SRA-123456'],
  ],
  content: JSON.stringify({ verifiedAt: new Date().toISOString() }),
})

console.log('=== Attestation Template ===')
console.log('Kind:', credentialTemplate.kind)        // 31000
console.log('D-tag:', credentialTemplate.tags.find(t => t[0] === 'd'))
// => ['d', 'credential:abc123pubkeyhex...']
console.log()

// ---------------------------------------------------------------------------
// 2. Validate structural correctness before signing
// ---------------------------------------------------------------------------

// Build a fake signed event to demonstrate validateAttestation
const fakeSignedEvent = {
  kind: ATTESTATION_KIND,
  pubkey: 'attestor-pubkey-hex',
  created_at: Math.floor(Date.now() / 1000),
  tags: credentialTemplate.tags,
  content: credentialTemplate.content,
  id: 'fake-event-id',
  sig: 'fake-sig',
}

const validationResult = validateAttestation(fakeSignedEvent)
console.log('=== Validation ===')
console.log('Valid:', validationResult.valid)        // true
console.log('Errors:', validationResult.errors)     // []
console.log()

// ---------------------------------------------------------------------------
// 3. Parse a signed event
// ---------------------------------------------------------------------------

const parsed = parseAttestation(fakeSignedEvent)
if (parsed) {
  console.log('=== Parsed Attestation ===')
  console.log('Type:', parsed.type)                  // 'credential'
  console.log('Subject:', parsed.subject)            // subject pubkey
  console.log('Identifier:', parsed.identifier)      // subject pubkey (from d-tag)
  console.log('Revoked:', parsed.revoked)            // false
  console.log('Expiration:', parsed.expiration)      // unix timestamp
  console.log()
}

// ---------------------------------------------------------------------------
// 4. Check validity window
// ---------------------------------------------------------------------------

if (parsed) {
  const validity = isValid(parsed)
  console.log('=== Validity Window ===')
  console.log('Is valid now:', validity.valid)       // true
  console.log('Reason (if invalid):', validity.reason)
  console.log()
}

// ---------------------------------------------------------------------------
// 5. Check revocation status
// ---------------------------------------------------------------------------

console.log('=== Revocation Check ===')
console.log('Is revoked:', isRevoked(fakeSignedEvent))  // false
console.log()

// ---------------------------------------------------------------------------
// 6. Create a revocation
// ---------------------------------------------------------------------------

const revocationTemplate = createRevocation({
  type: TYPES.CREDENTIAL,
  identifier: subjectPubkey,
  subject: subjectPubkey,
  reason: 'Licence lapsed — annual renewal not completed',
  effective: Math.floor(Date.now() / 1000),
})

console.log('=== Revocation Template ===')
console.log('Kind:', revocationTemplate.kind)        // 31000
console.log('Status tag:', revocationTemplate.tags.find(t => t[0] === 'status'))
// => ['status', 'revoked']
console.log()

// ---------------------------------------------------------------------------
// 7. Build relay query filters
// ---------------------------------------------------------------------------

const queryFilter = attestationFilter({
  type: TYPES.CREDENTIAL,
  subject: subjectPubkey,
  authors: ['attestor-pubkey-hex'],
})
console.log('=== Attestation Filter ===')
console.log(JSON.stringify(queryFilter, null, 2))
// { kinds: [31000], authors: [...], '#p': [...], '#type': ['credential'] }
console.log()

const revCheckFilter = revocationFilter(TYPES.CREDENTIAL, subjectPubkey)
console.log('=== Revocation Check Filter ===')
console.log(JSON.stringify(revCheckFilter, null, 2))
// { kinds: [31000], '#d': ['credential:abc123...'] }
console.log()

// ---------------------------------------------------------------------------
// 8. D-tag helpers
// ---------------------------------------------------------------------------

console.log('=== D-tag Helpers ===')
const dTag = buildDTag('credential', subjectPubkey)
console.log('Built d-tag:', dTag)
// => 'credential:abc123...'

const parsed2 = parseDTag(dTag)
console.log('Parsed d-tag:', parsed2)
// => { type: 'credential', identifier: 'abc123...' }
console.log()

// ---------------------------------------------------------------------------
// 9. Endorsement (peer vouching)
// ---------------------------------------------------------------------------

const endorsement = createAttestation({
  type: TYPES.ENDORSEMENT,
  identifier: subjectPubkey,
  subject: subjectPubkey,
  summary: 'Reliable counterparty — 10 successful trades',
  tags: [['context', 'p2p-trading']],
})

console.log('=== Endorsement ===')
console.log('D-tag:', endorsement.tags.find(t => t[0] === 'd'))
// => ['d', 'endorsement:abc123...']
console.log()

// ---------------------------------------------------------------------------
// 10. Assertion-only attestation (confirm a first-person claim)
// ---------------------------------------------------------------------------

const assertionConfirmation = createAttestation({
  assertion: {
    id: 'some-self-claim-event-id',
    relay: 'wss://relay.example.com',
  },
  summary: 'First-person claim confirmed by independent verifier',
})

console.log('=== Assertion-only Attestation ===')
console.log('D-tag:', assertionConfirmation.tags.find(t => t[0] === 'd'))
// => ['d', 'assertion:some-self-claim-event-id']
console.log('Assertion e-tag:', assertionConfirmation.tags.find(t => t[0] === 'e'))
// => ['e', 'some-self-claim-event-id', 'wss://relay.example.com', 'assertion']
