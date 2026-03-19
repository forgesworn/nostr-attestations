import { describe, it, expect } from 'vitest'
import { validateAttestation } from '../src/validators.js'
import { ATTESTATION_KIND } from '../src/constants.js'
import type { NostrEvent } from '../src/types.js'

function makeEvent(tags: string[][] = [], kind = ATTESTATION_KIND): NostrEvent {
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

  it('fails when type tag is missing', () => {
    const result = validateAttestation(makeEvent([
      ['d', 'credential:abc'],
    ]))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('missing required type tag')
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
      ['s', 'revoked'],
    ]))
    expect(result.valid).toBe(true)
  })
})
