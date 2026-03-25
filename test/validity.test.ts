import { describe, it, expect } from 'vitest'
import { isValid } from '../src/validity.js'

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    kind: 31000,
    pubkey: 'pub1',
    id: 'id1',
    sig: 'sig1',
    created_at: 1000,
    tags: [
      ['d', 'endorsement:abc'],
      ['type', 'endorsement'],
      ['p', 'abc'],
    ],
    content: '',
    ...overrides,
  }
}

describe('isValid', () => {
  it('returns valid for active attestation', () => {
    const result = isValid(makeEvent())
    expect(result.valid).toBe(true)
  })

  it('returns invalid for revoked attestation', () => {
    const event = makeEvent({
      tags: [['d', 'endorsement:abc'], ['type', 'endorsement'], ['status', 'revoked']],
    })
    const result = isValid(event)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('revoked')
  })

  it('returns invalid when expired', () => {
    const past = Math.floor(Date.now() / 1000) - 3600
    const event = makeEvent({
      tags: [['d', 'endorsement:abc'], ['type', 'endorsement'], ['expiration', String(past)]],
    })
    const result = isValid(event)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('expired')
  })

  it('returns inactive when valid_from is in the future', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    const event = makeEvent({
      tags: [['d', 'endorsement:abc'], ['type', 'endorsement'], ['valid_from', String(future)]],
    })
    const result = isValid(event)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('not-yet-active')
  })

  it('returns invalid when valid_to has passed', () => {
    const past = Math.floor(Date.now() / 1000) - 3600
    const event = makeEvent({
      tags: [['d', 'endorsement:abc'], ['type', 'endorsement'], ['valid_to', String(past)]],
    })
    const result = isValid(event)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('claim-expired')
  })

  it('revocation takes precedence over active expiration', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    const event = makeEvent({
      tags: [['d', 'endorsement:abc'], ['type', 'endorsement'], ['status', 'revoked'], ['expiration', String(future)]],
    })
    const result = isValid(event)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('revoked')
  })

  it('accepts custom now timestamp', () => {
    const event = makeEvent({
      tags: [['d', 'endorsement:abc'], ['type', 'endorsement'], ['expiration', '2000']],
    })
    const result = isValid(event, 1500)
    expect(result.valid).toBe(true)
  })
})
