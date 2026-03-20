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

  it('throws if type is empty', () => {
    expect(() => createAttestation({ type: '' })).toThrow('type must not be empty')
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
})
