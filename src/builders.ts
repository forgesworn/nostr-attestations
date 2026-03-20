import { ATTESTATION_KIND } from './constants.js'
import { buildDTag } from './filters.js'
import type { AttestationParams, RevocationParams, EventTemplate } from './types.js'

/**
 * Create an unsigned attestation event template.
 * The caller is responsible for signing (adding pubkey, id, sig, created_at).
 */
export function createAttestation(params: AttestationParams): EventTemplate {
  if (!params.type) throw new Error('type must not be empty')
  if (params.type.includes(':')) throw new Error('type must not contain colons')

  const tags: string[][] = []

  // d-tag: type:identifier, or type:subject if no identifier, or just type
  const identifier = params.identifier ?? params.subject
  if (identifier) {
    tags.push(['d', buildDTag(params.type, identifier)])
  } else {
    tags.push(['d', params.type])
  }

  tags.push(['type', params.type])

  if (params.subject) {
    tags.push(['p', params.subject])
  }

  if (params.summary) {
    tags.push(['summary', params.summary])
  }

  if (params.expiration != null) {
    if (!Number.isFinite(params.expiration)) throw new Error('expiration must be a finite number')
    tags.push(['expiration', String(params.expiration)])
  }

  if (params.tags) {
    for (const tag of params.tags) {
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
 */
export function createRevocation(params: RevocationParams): EventTemplate {
  const tags: string[][] = [
    ['d', buildDTag(params.type, params.identifier)],
    ['type', params.type],
    ['status', 'revoked'],
  ]

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
