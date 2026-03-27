import { describe, it, expect } from 'vitest'
import { createAttestation, createRevocation } from '../src/builders.js'
import { ATTESTATION_KIND } from '../src/constants.js'

describe('createAttestation', () => {
  it('creates minimal attestation with required tags only', () => {
    const event = createAttestation({ type: 'credential' })
    expect(event.kind).toBe(ATTESTATION_KIND)
    expect(event.tags).toContainEqual(['type', 'credential'])
    expect(event.content).toBe('')
  })

  it('builds d-tag from type and identifier', () => {
    const event = createAttestation({ type: 'credential', identifier: 'abc123' })
    expect(event.tags).toContainEqual(['d', 'credential:abc123'])
  })

  it('uses type as d-tag when no identifier', () => {
    const event = createAttestation({ type: 'verifier' })
    expect(event.tags).toContainEqual(['d', 'verifier'])
  })

  it('adds p tag when subject provided', () => {
    const event = createAttestation({ type: 'credential', subject: 'abc123' })
    expect(event.tags).toContainEqual(['p', 'abc123'])
  })

  it('omits p tag when no subject', () => {
    const event = createAttestation({ type: 'verifier' })
    const pTags = event.tags.filter(t => t[0] === 'p')
    expect(pTags).toHaveLength(0)
  })

  it('adds summary tag', () => {
    const event = createAttestation({ type: 'credential', summary: 'Verified attorney' })
    expect(event.tags).toContainEqual(['summary', 'Verified attorney'])
  })

  it('adds expiration tag', () => {
    const event = createAttestation({ type: 'credential', expiration: 1735689600 })
    expect(event.tags).toContainEqual(['expiration', '1735689600'])
  })

  it('merges additional application-specific tags', () => {
    const event = createAttestation({
      type: 'credential',
      tags: [['profession', 'attorney'], ['jurisdiction', 'US-NY']],
    })
    expect(event.tags).toContainEqual(['profession', 'attorney'])
    expect(event.tags).toContainEqual(['jurisdiction', 'US-NY'])
  })

  it('sets content', () => {
    const event = createAttestation({ type: 'credential', content: '{"proof":"..."}' })
    expect(event.content).toBe('{"proof":"..."}')
  })

  it('throws if neither type nor assertion provided', () => {
    expect(() => createAttestation({})).toThrow('at least one of type or assertion must be provided')
  })

  it('throws if type is empty string without assertion', () => {
    expect(() => createAttestation({ type: '' })).toThrow('at least one of type or assertion must be provided')
  })

  it('throws if type contains colons', () => {
    expect(() => createAttestation({ type: 'foo:bar' })).toThrow('must not contain colons')
  })

  it('throws if expiration is NaN', () => {
    expect(() => createAttestation({ type: 'credential', expiration: NaN })).toThrow('expiration must be a finite number')
  })

  it('throws if expiration is Infinity', () => {
    expect(() => createAttestation({ type: 'credential', expiration: Infinity })).toThrow('expiration must be a finite number')
  })

  it('adds valid_from tag', () => {
    const event = createAttestation({ type: 'credential', validFrom: 1700000000 })
    expect(event.tags).toContainEqual(['valid_from', '1700000000'])
  })

  it('throws if validFrom is NaN', () => {
    expect(() => createAttestation({ type: 'credential', validFrom: NaN })).toThrow('validFrom must be a finite number')
  })

  it('defaults identifier to subject when subject provided but no identifier', () => {
    const event = createAttestation({ type: 'credential', subject: 'deadbeef' })
    expect(event.tags).toContainEqual(['d', 'credential:deadbeef'])
  })

  it('creates assertion-only attestation with e-tag', () => {
    const event = createAttestation({ assertion: { id: 'evt999', relay: 'wss://relay.example.com' } })
    expect(event.tags).toContainEqual(['d', 'assertion:evt999'])
    expect(event.tags).toContainEqual(['e', 'evt999', 'wss://relay.example.com', 'assertion'])
    const typeTags = event.tags.filter(t => t[0] === 'type')
    expect(typeTags).toHaveLength(0)
  })

  it('creates assertion-only attestation with a-tag', () => {
    const event = createAttestation({ assertion: { address: '30023:abc:my-claim' } })
    expect(event.tags).toContainEqual(['d', 'assertion:30023:abc:my-claim'])
    expect(event.tags).toContainEqual(['a', '30023:abc:my-claim', '', 'assertion'])
  })

  it('creates attestation with both type and assertion', () => {
    const event = createAttestation({
      type: 'credential',
      subject: 'def456',
      assertion: { id: 'evt999' },
    })
    expect(event.tags).toContainEqual(['d', 'assertion:evt999'])
    expect(event.tags).toContainEqual(['type', 'credential'])
    expect(event.tags).toContainEqual(['e', 'evt999', '', 'assertion'])
  })

  it('uses assertion: d-tag when both type and assertion ref are present (hybrid)', () => {
    const result = createAttestation({
      type: 'credential',
      assertion: { id: 'evt999' },
      subject: 'def456',
      summary: 'Hybrid attestation',
    })
    const dTag = result.tags.find(t => t[0] === 'd')
    expect(dTag![1]).toBe('assertion:evt999')
    // type tag should still be present
    const typeTag = result.tags.find(t => t[0] === 'type')
    expect(typeTag![1]).toBe('credential')
  })

  it('rejects reserved type "assertion" in builder', () => {
    expect(() => createAttestation({
      type: 'assertion',
      subject: 'abc123',
    })).toThrow('type value "assertion" is reserved')
  })

  it('throws if assertion has both id and address', () => {
    expect(() => createAttestation({ assertion: { id: 'a', address: 'b' } })).toThrow('not both')
  })

  it('throws if assertion has neither id nor address', () => {
    expect(() => createAttestation({ assertion: {} })).toThrow('must have id or address')
  })

  it('adds valid_to tag', () => {
    const event = createAttestation({ type: 'credential', validTo: 1735689600 })
    expect(event.tags).toContainEqual(['valid_to', '1735689600'])
  })

  it('throws if validTo is not finite', () => {
    expect(() => createAttestation({ type: 'credential', validTo: NaN })).toThrow('validTo must be a finite number')
  })

  it('throws if validTo <= validFrom', () => {
    expect(() => createAttestation({ type: 'credential', validFrom: 1700000000, validTo: 1700000000 })).toThrow('validTo must be greater than validFrom')
  })

  it('adds request tag', () => {
    const event = createAttestation({ type: 'credential', request: '31872:abc:req1' })
    expect(event.tags).toContainEqual(['request', '31872:abc:req1'])
  })

  it('adds schema tag', () => {
    const event = createAttestation({ type: 'credential', schema: 'https://signet.dev/schemas/v1' })
    expect(event.tags).toContainEqual(['schema', 'https://signet.dev/schemas/v1'])
  })

  it('throws if schema is empty string', () => {
    expect(() => createAttestation({ type: 'credential', schema: '  ' })).toThrow('schema must not be empty')
  })

  it('adds NIP-32 L namespace and l type label for typed attestations', () => {
    const event = createAttestation({ type: 'credential', identifier: 'abc' })
    expect(event.tags).toContainEqual(['L', 'nip-va'])
    expect(event.tags).toContainEqual(['l', 'credential', 'nip-va'])
  })

  it('adds NIP-32 L namespace but no l tag for assertion-only attestations', () => {
    const event = createAttestation({ assertion: { id: 'evt999' } })
    expect(event.tags).toContainEqual(['L', 'nip-va'])
    const lTags = event.tags.filter(t => t[0] === 'l')
    expect(lTags).toHaveLength(0)
  })

  it('adds occurred_at tag', () => {
    const event = createAttestation({ type: 'credential', occurredAt: 1710900000 })
    expect(event.tags).toContainEqual(['occurred_at', '1710900000'])
  })

  it('throws if occurredAt is NaN', () => {
    expect(() => createAttestation({ type: 'credential', occurredAt: NaN })).toThrow('occurredAt must be a finite number')
  })

  it('throws if occurredAt is Infinity', () => {
    expect(() => createAttestation({ type: 'credential', occurredAt: Infinity })).toThrow('occurredAt must be a finite number')
  })
})

describe('createRevocation', () => {
  it('creates revocation with status:revoked tag', () => {
    const event = createRevocation({ type: 'credential', identifier: 'abc123' })
    expect(event.kind).toBe(ATTESTATION_KIND)
    expect(event.tags).toContainEqual(['status', 'revoked'])
    expect(event.tags).toContainEqual(['type', 'credential'])
    expect(event.tags).toContainEqual(['d', 'credential:abc123'])
  })

  it('adds reason tag', () => {
    const event = createRevocation({
      type: 'credential',
      identifier: 'abc123',
      reason: 'license-expired',
    })
    expect(event.tags).toContainEqual(['reason', 'license-expired'])
  })

  it('adds effective tag as string', () => {
    const event = createRevocation({
      type: 'credential',
      identifier: 'abc123',
      effective: 1704067200,
    })
    expect(event.tags).toContainEqual(['effective', '1704067200'])
  })

  it('throws if effective is NaN', () => {
    expect(() => createRevocation({ type: 'credential', identifier: 'abc', effective: NaN })).toThrow('effective must be a finite number')
  })

  it('adds p tag when subject provided', () => {
    const event = createRevocation({
      type: 'credential',
      identifier: 'abc123',
      subject: 'abc123',
    })
    expect(event.tags).toContainEqual(['p', 'abc123'])
  })

  it('creates revocation for assertion-only attestation by event id', () => {
    const event = createRevocation({ assertionId: 'evt999' })
    expect(event.tags).toContainEqual(['d', 'assertion:evt999'])
    expect(event.tags).toContainEqual(['status', 'revoked'])
    const typeTags = event.tags.filter(t => t[0] === 'type')
    expect(typeTags).toHaveLength(0)
  })

  it('creates revocation for assertion-only attestation by address', () => {
    const event = createRevocation({ assertionAddress: '30023:abc:claim' })
    expect(event.tags).toContainEqual(['d', 'assertion:30023:abc:claim'])
    expect(event.tags).toContainEqual(['status', 'revoked'])
  })

  it('throws if neither typed nor assertion revocation params', () => {
    expect(() => createRevocation({})).toThrow('provide (type + identifier) or (assertionId | assertionAddress)')
  })

  it('throws if both assertionId and assertionAddress provided', () => {
    expect(() => createRevocation({ assertionId: 'a', assertionAddress: 'b' })).toThrow('not both')
  })
})
