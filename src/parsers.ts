import { ATTESTATION_KIND } from './constants.js'
import { findTag } from './helpers.js'
import { parseDTag } from './filters.js'
import type { NostrEvent, Attestation } from './types.js'

/**
 * Parse a NostrEvent into a typed Attestation.
 * Returns null if the event is not a valid kind 31000 attestation.
 */
export function parseAttestation(event: NostrEvent): Attestation | null {
  if (event.kind !== ATTESTATION_KIND) return null

  const type = findTag(event.tags, 'type')
  if (!type) return null

  const dTag = findTag(event.tags, 'd')
  const parsed = dTag ? parseDTag(dTag) : null

  const expirationStr = findTag(event.tags, 'expiration')

  return {
    kind: ATTESTATION_KIND as 31000,
    type,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    identifier: parsed?.identifier ?? null,
    subject: findTag(event.tags, 'p'),
    summary: findTag(event.tags, 'summary'),
    expiration: expirationStr ? Number(expirationStr) : null,
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
