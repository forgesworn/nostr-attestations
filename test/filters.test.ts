import { describe, it, expect } from 'vitest'
import { buildDTag, parseDTag, attestationFilter, revocationFilter } from '../src/filters.js'

describe('buildDTag', () => {
  it('joins type and identifier with colon', () => {
    expect(buildDTag('credential', 'abc123')).toBe('credential:abc123')
  })

  it('handles identifier-only (type as d-tag)', () => {
    expect(buildDTag('verifier', 'notary')).toBe('verifier:notary')
  })

  it('throws if type contains a colon', () => {
    expect(() => buildDTag('foo:bar', 'abc')).toThrow('must not contain colons')
  })

  it('throws if type is empty', () => {
    expect(() => buildDTag('', 'abc')).toThrow('type must not be empty')
  })
})

describe('parseDTag', () => {
  it('parses type:identifier', () => {
    expect(parseDTag('credential:abc123')).toEqual({
      type: 'credential',
      identifier: 'abc123',
    })
  })

  it('returns null for d-tag with no colon', () => {
    expect(parseDTag('nocolon')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDTag('')).toBeNull()
  })

  it('treats first colon as delimiter (identifier may contain colons)', () => {
    expect(parseDTag('credential:some:complex:id')).toEqual({
      type: 'credential',
      identifier: 'some:complex:id',
    })
  })
})

describe('attestationFilter', () => {
  it('returns filter with kind 31000', () => {
    const filter = attestationFilter({})
    expect(filter.kinds).toEqual([31000])
  })

  it('adds authors when provided', () => {
    const filter = attestationFilter({ authors: ['abc', 'def'] })
    expect(filter.authors).toEqual(['abc', 'def'])
  })

  it('adds #p when subject provided', () => {
    const filter = attestationFilter({ subject: 'abc123' })
    expect(filter['#p']).toEqual(['abc123'])
  })

  it('adds #type when type provided', () => {
    const filter = attestationFilter({ type: 'credential' })
    expect(filter['#type']).toEqual(['credential'])
  })
})

describe('revocationFilter', () => {
  it('returns filter matching the exact d-tag', () => {
    const filter = revocationFilter('credential', 'abc123')
    expect(filter.kinds).toEqual([31000])
    expect(filter['#d']).toEqual(['credential:abc123'])
  })
})
