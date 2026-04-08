import { ATTESTATION_KIND } from './constants.js'
import { buildDTag, buildAssertionDTag } from './filters.js'
import { isHex64 } from './helpers.js'
import type { AttestationParams, RevocationParams, EventTemplate } from './types.js'

/**
 * Create an unsigned attestation event template.
 * The caller is responsible for signing (adding pubkey, id, sig, created_at).
 *
 * At least one of `type` or `assertion` must be provided.
 */
export function createAttestation(params: AttestationParams): EventTemplate {
  const hasType = !!params.type
  const hasAssertion = !!params.assertion

  if (!hasType && !hasAssertion) {
    throw new Error('at least one of type or assertion must be provided')
  }

  if (hasType) {
    if (params.type!.includes(':')) throw new Error('type must not contain colons')
    if (params.type! === 'assertion') throw new Error('type value "assertion" is reserved')
  }

  if (params.subject != null && !isHex64(params.subject)) {
    throw new Error('subject must be a 64-character lowercase hex pubkey')
  }

  if (hasAssertion) {
    const a = params.assertion!
    if (a.id && a.address) throw new Error('assertion must have id or address, not both')
    if (!a.id && !a.address) throw new Error('assertion must have id or address')
    if (a.id && !isHex64(a.id)) throw new Error('assertion id must be a 64-character lowercase hex event ID')
  }

  if (params.validTo != null) {
    if (!Number.isFinite(params.validTo)) throw new Error('validTo must be a finite number')
    if (params.validFrom != null && params.validTo <= params.validFrom) {
      throw new Error('validTo must be greater than validFrom')
    }
  }

  if (params.schema != null && !params.schema.trim()) {
    throw new Error('schema must not be empty')
  }

  const tags: string[][] = []

  // d-tag construction: assertion-first takes precedence
  if (hasAssertion) {
    const ref = params.assertion!.id ?? params.assertion!.address!
    tags.push(['d', buildAssertionDTag(ref)])
  } else if (hasType) {
    const identifier = params.identifier ?? params.subject
    if (!identifier) {
      throw new Error('direct claims require either identifier or subject to form a valid d-tag')
    }
    tags.push(['d', buildDTag(params.type!, identifier)])
  }

  // type tag (present for both direct claims and hybrid attestations)
  if (hasType) {
    tags.push(['type', params.type!])
  }

  if (params.subject) {
    tags.push(['p', params.subject])
  }

  // Assertion reference tags
  if (hasAssertion) {
    const a = params.assertion!
    if (a.id) {
      const eTag = ['e', a.id]
      if (a.relay) eTag.push(a.relay)
      else eTag.push('')
      eTag.push('assertion')
      tags.push(eTag)
    } else if (a.address) {
      const aTag = ['a', a.address]
      if (a.relay) aTag.push(a.relay)
      else aTag.push('')
      aTag.push('assertion')
      tags.push(aTag)
    }
  }

  if (params.summary) {
    tags.push(['summary', params.summary])
  }

  if (params.expiration != null) {
    if (!Number.isFinite(params.expiration)) throw new Error('expiration must be a finite number')
    tags.push(['expiration', String(params.expiration)])
  }

  if (params.validFrom != null) {
    if (!Number.isFinite(params.validFrom)) throw new Error('validFrom must be a finite number')
    tags.push(['valid_from', String(params.validFrom)])
  }

  if (params.validTo != null) {
    tags.push(['valid_to', String(params.validTo)])
  }

  if (params.request) {
    tags.push(['request', params.request])
  }

  if (params.schema) {
    tags.push(['schema', params.schema])
  }

  if (params.occurredAt != null) {
    if (!Number.isFinite(params.occurredAt)) throw new Error('occurredAt must be a finite number')
    tags.push(['occurred_at', String(params.occurredAt)])
  }

  // NIP-32 discoverability labels (NIP-VA §Discoverability Labels)
  tags.push(['L', 'nip-va'])
  if (hasType) {
    tags.push(['l', params.type!, 'nip-va'])
  }

  if (params.tags) {
    // Reserved tag names that the library manages — reject user overrides
    const reserved = new Set(['d', 'type', 'status', 'L', 'l'])
    for (const tag of params.tags) {
      if (reserved.has(tag[0]!)) {
        throw new Error(`custom tags must not override reserved tag "${tag[0]}"`)
      }
      tags.push(tag)
    }
  }

  return {
    kind: ATTESTATION_KIND,
    tags,
    content: params.content ?? '',
  }
}

/**
 * Create an unsigned revocation event template.
 * When published, this replaces the original attestation via addressable event semantics.
 *
 * For typed attestations: provide `type` + `identifier`.
 * For assertion-only attestations: provide `assertionId` or `assertionAddress`.
 */
export function createRevocation(params: RevocationParams): EventTemplate {
  const hasTyped = !!params.type && params.identifier != null
  const hasAssertion = !!params.assertionId || !!params.assertionAddress

  if (!hasTyped && !hasAssertion) {
    throw new Error('provide (type + identifier) or (assertionId | assertionAddress)')
  }

  if (params.assertionId && params.assertionAddress) {
    throw new Error('provide assertionId or assertionAddress, not both')
  }

  if (hasTyped && params.type === 'assertion') {
    throw new Error('type value "assertion" is reserved')
  }

  if (params.subject != null && !isHex64(params.subject)) {
    throw new Error('subject must be a 64-character lowercase hex pubkey')
  }

  const tags: string[][] = []

  if (hasTyped) {
    tags.push(['d', buildDTag(params.type!, params.identifier!)])
    tags.push(['type', params.type!])
  } else {
    const ref = (params.assertionId ?? params.assertionAddress)!
    tags.push(['d', buildAssertionDTag(ref)])
  }

  tags.push(['status', 'revoked'])

  if (params.subject) {
    tags.push(['p', params.subject])
  }

  if (params.reason) {
    tags.push(['reason', params.reason])
  }

  if (params.effective != null) {
    if (!Number.isFinite(params.effective)) throw new Error('effective must be a finite number')
    tags.push(['effective', String(params.effective)])
  }

  return {
    kind: ATTESTATION_KIND,
    tags,
    content: '',
  }
}
