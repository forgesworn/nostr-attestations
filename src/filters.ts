import { ATTESTATION_KIND } from './constants.js'
import type { FilterParams, NostrFilter } from './types.js'

/** Assertion d-tag prefix for assertion-only attestations. */
const ASSERTION_PREFIX = 'assertion'

/**
 * Build a d-tag from type and identifier.
 * Type values must not contain colons — the first colon is the delimiter.
 */
export function buildDTag(type: string, identifier: string): string {
  if (!type) throw new Error('type must not be empty')
  if (type.includes(':')) throw new Error('type must not contain colons')
  return `${type}:${identifier}`
}

/**
 * Build a d-tag for an assertion-only attestation.
 * Uses the `assertion:` prefix followed by the assertion reference.
 */
export function buildAssertionDTag(ref: string): string {
  if (!ref) throw new Error('assertion reference must not be empty')
  return `${ASSERTION_PREFIX}:${ref}`
}

/**
 * Parse a d-tag into type and identifier.
 * Returns null if the d-tag does not contain a colon.
 * For assertion-only attestations (prefix `assertion:`), type is the string "assertion".
 */
export function parseDTag(dTag: string): { type: string; identifier: string } | null {
  const idx = dTag.indexOf(':')
  if (idx <= 0) return null
  const prefix = dTag.slice(0, idx)
  const rest = dTag.slice(idx + 1)
  return { type: prefix, identifier: rest }
}

/** Build a Nostr relay filter for querying attestation events. */
export function attestationFilter(params: FilterParams): NostrFilter {
  const filter: NostrFilter = { kinds: [ATTESTATION_KIND] }
  if (params.authors?.length) filter.authors = params.authors
  if (params.subject) filter['#p'] = [params.subject]
  if (params.type) filter['#type'] = [params.type]
  if (params.schema) filter['#schema'] = [params.schema]
  return filter
}

/** Build a Nostr relay filter for fetching the latest version of a specific attestation (for revocation checking). */
export function revocationFilter(type: string, identifier: string): NostrFilter
/** Build a Nostr relay filter for an assertion-only attestation by its reference. */
export function revocationFilter(options: { assertionId?: string; assertionAddress?: string }): NostrFilter
export function revocationFilter(
  typeOrOptions: string | { assertionId?: string; assertionAddress?: string },
  identifier?: string,
): NostrFilter {
  if (typeof typeOrOptions === 'string') {
    return {
      kinds: [ATTESTATION_KIND],
      '#d': [buildDTag(typeOrOptions, identifier!)],
    }
  }
  const ref = typeOrOptions.assertionId ?? typeOrOptions.assertionAddress
  if (!ref) throw new Error('assertionId or assertionAddress required')
  return {
    kinds: [ATTESTATION_KIND],
    '#d': [buildAssertionDTag(ref)],
  }
}
