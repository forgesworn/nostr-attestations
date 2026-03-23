import { describe, it, expect } from 'vitest'
import { validateAttestation } from '../src/validators.js'
import { ATTESTATION_KIND } from '../src/constants.js'
import type { NostrEvent } from '../src/types.js'

function makeEvent(tags: string[][] = [], kind: number = ATTESTATION_KIND): NostrEvent {
  return {
    kind,
    pubkey: 'aabb',
    created_at: 1700000000,
    tags,
    content: '',
    id: 'id',
    sig: 'sig',
  }
}

describe('validateAttestation', () => {
  it('passes for valid attestation with all required tags', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
      ['type', 'credential'],
    ]))
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails for wrong kind', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
      ['type', 'credential'],
    ], 1))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('kind must be 31000')
  })

  it('fails when d tag is missing', () => {
    const result = validateAttestation(makeEvent([
      ['type', 'credential'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('missing required d tag')
  })

  it('fails when neither type nor assertion present', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('missing required type tag (or assertion reference)')
  })

  it('fails when type tag is empty string', () => {
    const result = validateAttestation(makeEvent([
      ['d', ''],
      ['type', ''],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('type tag must not be empty')
  })

  it('fails when type contains colons', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'foo:bar:abc'],
      ['type', 'foo:bar'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('type must not contain colons')
  })

  it('fails when d tag does not start with type value', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'endorsement:abc'],
      ['type', 'credential'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('d tag must start with type value')
  })

  it('collects multiple errors', () => {
    const result = validateAttestation(makeEvent([], 1))
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })

  it('passes for self-attestation (no p tag)', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'verifier'],
      ['type', 'verifier'],
    ]))
    expect(result.valid).toBe(true)
  })

  it('passes for revocation event', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
      ['type', 'credential'],
      ['status', 'revoked'],
    ]))
    expect(result.valid).toBe(true)
  })

  it('passes for assertion-only attestation', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'assertion:evt999'],
      ['e', 'evt999', 'wss://relay.example.com', 'assertion'],
    ]))
    expect(result.valid).toBe(true)
  })

  it('fails for assertion-only without assertion: d-tag prefix', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'wrong:evt999'],
      ['e', 'evt999', '', 'assertion'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('assertion:')
  })

  it('fails when multiple assertion refs present', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'assertion:evt999'],
      ['e', 'evt1', '', 'assertion'],
      ['e', 'evt2', '', 'assertion'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('at most one assertion reference allowed')
  })

  it('fails when both e and a assertion refs present', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'assertion:evt999'],
      ['e', 'evt1', '', 'assertion'],
      ['a', '30023:abc:claim', '', 'assertion'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('cannot have both e-tag and a-tag assertion references')
  })

  it('fails when valid_to <= valid_from', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
      ['type', 'credential'],
      ['valid_from', '1700000000'],
      ['valid_to', '1700000000'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('valid_to must be greater than valid_from')
  })

  it('passes when valid_to > valid_from', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
      ['type', 'credential'],
      ['valid_from', '1700000000'],
      ['valid_to', '1735689600'],
    ]))
    expect(result.valid).toBe(true)
  })

  it('fails when schema is empty', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
      ['type', 'credential'],
      ['schema', ''],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('schema must not be empty')
  })
})
