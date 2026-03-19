import { ATTESTATION_KIND } from './constants.js'
import type { FilterParams, NostrFilter } from './types.js'

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
 * Parse a d-tag into type and identifier.
 * Returns null if the d-tag does not contain a colon.
 */
export function parseDTag(dTag: string): { type: string; identifier: string } | null {
  const idx = dTag.indexOf(':')
  if (idx <= 0) return null
  return {
    type: dTag.slice(0, idx),
    identifier: dTag.slice(idx + 1),
  }
}

/** Build a Nostr relay filter for querying attestation events. */
export function attestationFilter(params: FilterParams): NostrFilter {
  const filter: NostrFilter = { kinds: [ATTESTATION_KIND] }
  if (params.authors?.length) filter.authors = params.authors
  if (params.subject) filter['#p'] = [params.subject]
  if (params.type) filter['#type'] = [params.type]
  return filter
}

/** Build a Nostr relay filter for fetching the latest version of a specific attestation (for revocation checking). */
export function revocationFilter(type: string, identifier: string): NostrFilter {
  return {
    kinds: [ATTESTATION_KIND],
    '#d': [buildDTag(type, identifier)],
  }
}
