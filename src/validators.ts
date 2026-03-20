import { ATTESTATION_KIND } from './constants.js'
import { findTag } from './helpers.js'
import type { NostrEvent, ValidationResult } from './types.js'

/**
 * Validate structural correctness of a Nostr event as a kind 31000 attestation.
 * Does not verify signatures or check relay state.
 */
export function validateAttestation(event: NostrEvent): ValidationResult {
  const errors: string[] = []

  if (event.kind !== ATTESTATION_KIND) {
    errors.push('kind must be 31000')
  }

  const dTag = findTag(event.tags, 'd')
  if (!dTag) {
    errors.push('missing required d tag')
  }

  const type = findTag(event.tags, 'type')
  if (type == null) {
    errors.push('missing required type tag')
  } else if (!type.trim()) {
    errors.push('type tag must not be empty')
  } else if (type.includes(':')) {
    errors.push('type must not contain colons')
  }

  // d-tag must start with the type value (or equal it for self-attestations)
  if (dTag && type && !type.includes(':')) {
    if (dTag !== type && !dTag.startsWith(`${type}:`)) {
      errors.push(`d tag must start with type value "${type}"`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
