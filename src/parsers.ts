import { ATTESTATION_KIND, TYPES } from './constants.js'
import { findTag } from './helpers.js'
import { parseDTag } from './filters.js'
import type { NostrEvent, Attestation } from './types.js'

/**
 * Find an e or a tag with the "assertion" marker (fourth element).
 * Returns the tag array or null.
 */
function findAssertionTag(tags: string[][]): string[] | null {
  return tags.find(t => (t[0] === 'e' || t[0] === 'a') && t[3] === 'assertion') ?? null
}

/**
 * Parse a NostrEvent into a typed Attestation.
 * Returns null if the event is not a valid kind 31000 attestation.
 *
 * An attestation must have either a type tag or an assertion reference.
 */
export function parseAttestation(event: NostrEvent): Attestation | null {
  if (event.kind !== ATTESTATION_KIND) return null

  const type = findTag(event.tags, 'type')
  const assertionTag = findAssertionTag(event.tags)

  // Must have type or assertion reference
  if (!type && !assertionTag) return null

  const dTag = findTag(event.tags, 'd')
  const parsed = dTag ? parseDTag(dTag) : null

  const expirationStr = findTag(event.tags, 'expiration')
  const validFromStr = findTag(event.tags, 'valid_from')
  const validToStr = findTag(event.tags, 'valid_to')
  const occurredAtStr = findTag(event.tags, 'occurred_at')

  return {
    kind: ATTESTATION_KIND as 31000,
    type: type ?? TYPES.ASSERTION,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    identifier: parsed?.identifier ?? null,
    subject: findTag(event.tags, 'p'),
    assertionId: assertionTag !== null && assertionTag[0] === 'e' ? (assertionTag[1] ?? null) : null,
    assertionAddress: assertionTag !== null && assertionTag[0] === 'a' ? (assertionTag[1] ?? null) : null,
    assertionRelay: (assertionTag !== null && assertionTag[2]) ? assertionTag[2] : null,
    summary: findTag(event.tags, 'summary'),
    expiration: expirationStr ? Number(expirationStr) : null,
    validFrom: validFromStr ? Number(validFromStr) : null,
    validTo: validToStr ? Number(validToStr) : null,
    request: findTag(event.tags, 'request'),
    schema: findTag(event.tags, 'schema'),
    occurredAt: occurredAtStr ? Number(occurredAtStr) : null,
    revoked: findTag(event.tags, 'status') === 'revoked',
    reason: findTag(event.tags, 'reason'),
    tags: event.tags,
    content: event.content,
  }
}

/**
 * Check whether a NostrEvent is a revoked attestation.
 * Returns false for non-attestation events.
 */
export function isRevoked(event: NostrEvent): boolean {
  if (event.kind !== ATTESTATION_KIND) return false
  return findTag(event.tags, 'status') === 'revoked'
}
