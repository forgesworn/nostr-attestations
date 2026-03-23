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

  it('returns null when neither type nor assertion present', () => {
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

  it('parses valid_from', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['valid_from', '1700000000'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.validFrom).toBe(1700000000)
  })

  it('returns null validFrom when tag absent', () => {
    const result = parseAttestation(makeEvent())
    expect(result!.validFrom).toBeNull()
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

  it('parses assertion-only attestation with e-tag', () => {
    const event = makeEvent({
      tags: [
        ['d', 'assertion:evt999'],
        ['e', 'evt999', 'wss://relay.example.com', 'assertion'],
        ['p', 'subject123'],
      ],
    })
    const result = parseAttestation(event)
    expect(result).not.toBeNull()
    expect(result!.type).toBeNull()
    expect(result!.assertionId).toBe('evt999')
    expect(result!.assertionAddress).toBeNull()
    expect(result!.assertionRelay).toBe('wss://relay.example.com')
  })

  it('parses assertion-only attestation with a-tag', () => {
    const event = makeEvent({
      tags: [
        ['d', 'assertion:30023:def456:claim'],
        ['a', '30023:def456:claim', 'wss://relay.example.com', 'assertion'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.type).toBeNull()
    expect(result!.assertionId).toBeNull()
    expect(result!.assertionAddress).toBe('30023:def456:claim')
    expect(result!.assertionRelay).toBe('wss://relay.example.com')
  })

  it('parses attestation with both type and assertion', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['e', 'evt999', '', 'assertion'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.type).toBe('credential')
    expect(result!.assertionId).toBe('evt999')
    expect(result!.assertionRelay).toBeNull()
  })

  it('returns null assertion fields when no assertion reference', () => {
    const result = parseAttestation(makeEvent())
    expect(result!.assertionId).toBeNull()
    expect(result!.assertionAddress).toBeNull()
    expect(result!.assertionRelay).toBeNull()
  })

  it('parses valid_to', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['valid_to', '1735689600'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.validTo).toBe(1735689600)
  })

  it('parses request tag', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['request', '31872:abc:req1'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.request).toBe('31872:abc:req1')
  })

  it('parses schema tag', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['schema', 'https://signet.dev/schemas/v1'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.schema).toBe('https://signet.dev/schemas/v1')
  })

  it('ignores e-tags without assertion marker', () => {
    const event = makeEvent({
      tags: [
        ['d', 'credential:sub'],
        ['type', 'credential'],
        ['e', 'evt999'],
      ],
    })
    const result = parseAttestation(event)
    expect(result!.assertionId).toBeNull()
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
