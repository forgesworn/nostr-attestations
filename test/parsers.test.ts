import { describe, it, expect } from 'vitest'
import { parseAttestation, isRevoked } from '../src/parsers.js'
import { ATTESTATION_KIND } from '../src/constants.js'
import type { NostrEvent } from '../src/types.js'

function makeEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    kind: ATTESTATION_KIND,
    pubkey: 'aabbccdd',
    created_at: 1700000000,
    tags: [
      ['d', 'credential:subject123'],
      ['type', 'credential'],
      ['p', 'subject123'],
    ],
    content: '',
    id: 'event-id',
    sig: 'event-sig',
    ...overrides,
  }
}

describe('parseAttestation', () => {
  it('parses a standard third-party attestation', () => {
    const result = parseAttestation(makeEvent())
    expect(result).not.toBeNull()
    expect(result!.kind).toBe(31000)
    expect(result!.type).toBe('credential')
    expect(result!.pubkey).toBe('aabbccdd')
    expect(result!.createdAt).toBe(1700000000)
    expect(result!.identifier).toBe('subject123')
    expect(result!.subject).toBe('subject123')
    expect(result!.revoked).toBe(false)
  })

  it('returns null for wrong kind', () => {
    expect(parseAttestation(makeEvent({ kind: 1 }))).toBeNull()
  })

  it('returns null when type tag is missing', () => {
    expect(parseAttestation(makeEvent({ tags: [['d', 'test']] }))).toBeNull()
  })

  it('parses self-attestation (no p tag)', () => {
    const event = makeEvent({
      tags: [
        ['d', 'verifier:notary'],
        ['type', 'verifier'],
        ['summary', 'Identity verification service'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.subject).toBeNull()
    expect(result!.identifier).toBe('notary')
    expect(result!.summary).toBe('Identity verification service')
  })

  it('parses expiration', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['expiration', '1735689600'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.expiration).toBe(1735689600)
  })

  it('detects revocation', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['status', 'revoked'],
        ['reason', 'license-expired'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.revoked).toBe(true)
    expect(result!.reason).toBe('license-expired')
  })

  it('preserves content', () => {
    const event = makeEvent({ content: '{"proof":"abc"}' })
    const result = parseAttestation(event)
    expect(result!.content).toBe('{"proof":"abc"}')
  })

  it('preserves all tags for application-specific access', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['profession', 'attorney'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.tags).toContainEqual(['profession', 'attorney'])
  })
})

describe('isRevoked', () => {
  it('returns false for normal attestation', () => {
    expect(isRevoked(makeEvent())).toBe(false)
  })

  it('returns true when status:revoked tag present', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['status', 'revoked'],
      ],
    })
    expect(isRevoked(event)).toBe(true)
  })

  it('returns false for status tag with other value', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['status', 'active'],
      ],
    })
    expect(isRevoked(event)).toBe(false)
  })

  it('returns false for wrong kind', () => {
    const event = makeEvent({
      kind: 1,
      tags: [['status', 'revoked']],
    })
    expect(isRevoked(event)).toBe(false)
  })
})
