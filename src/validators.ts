import { ATTESTATION_KIND } from './constants.js'
import { findTag } from './helpers.js'
import type { NostrEvent, ValidationResult } from './types.js'

/**
 * Check whether an event has an e or a tag with the "assertion" marker.
 */
function hasAssertionRef(tags: string[][]): boolean {
  return tags.some(t => (t[0] === 'e' || t[0] === 'a') && t[3] === 'assertion')
}

/**
 * Count assertion reference tags (e or a with "assertion" marker).
 */
function countAssertionRefs(tags: string[][]): { eCount: number; aCount: number } {
  let eCount = 0
  let aCount = 0
  for (const t of tags) {
    if (t[3] === 'assertion') {
      if (t[0] === 'e') eCount++
      else if (t[0] === 'a') aCount++
    }
  }
  return { eCount, aCount }
}

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
  const hasAssertion = hasAssertionRef(event.tags)

  // Must have type or assertion reference
  if (!type && !hasAssertion) {
    errors.push('missing required type tag (or assertion reference)')
  }

  // Type validation (when present)
  if (type != null) {
    if (!type.trim()) {
      errors.push('type tag must not be empty')
    } else if (type === 'assertion') {
      errors.push('type value "assertion" is reserved')
    } else if (type.includes(':')) {
      errors.push('type must not contain colons')
    }
  }

  // d-tag consistency
  if (dTag && type && !type.includes(':')) {
    // Typed attestation: d-tag must start with type value
    if (dTag !== type && !dTag.startsWith(`${type}:`)) {
      errors.push(`d tag must start with type value "${type}"`)
    }
  } else if (dTag && !type && hasAssertion) {
    // Assertion-only: d-tag must start with assertion: prefix
    if (!dTag.startsWith('assertion:')) {
      errors.push('d tag must start with "assertion:" prefix for assertion-only attestations')
    }
  }

  // Assertion reference constraints
  if (hasAssertion) {
    const { eCount, aCount } = countAssertionRefs(event.tags)
    if (eCount + aCount > 1) {
      errors.push('at most one assertion reference allowed')
    }
    if (eCount > 0 && aCount > 0) {
      errors.push('cannot have both e-tag and a-tag assertion references')
    }
  }

  // valid_to validation
  const validToStr = findTag(event.tags, 'valid_to')
  if (validToStr != null) {
    const validTo = Number(validToStr)
    if (!Number.isFinite(validTo)) {
      errors.push('valid_to must be a valid timestamp')
    } else {
      const validFromStr = findTag(event.tags, 'valid_from')
      if (validFromStr != null) {
        const validFrom = Number(validFromStr)
        if (Number.isFinite(validFrom) && validTo <= validFrom) {
          errors.push('valid_to must be greater than valid_from')
        }
      }
    }
  }

  // occurred_at validation
  const occurredAtStr = findTag(event.tags, 'occurred_at')
  if (occurredAtStr != null) {
    const occurredAt = Number(occurredAtStr)
    if (!Number.isFinite(occurredAt)) {
      errors.push('occurred_at must be a valid timestamp')
    }
  }

  // schema validation
  const schema = findTag(event.tags, 'schema')
  if (schema != null && !schema.trim()) {
    errors.push('schema must not be empty')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
