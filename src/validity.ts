import { findTag } from './helpers.js'
import type { NostrEvent } from './types.js'

export interface ValidityResult {
  valid: boolean
  reason?: 'revoked' | 'expired' | 'not-yet-active' | 'claim-expired'
}

/**
 * Check whether an attestation event is currently valid.
 * Checks revocation, NIP-40 expiration, valid_from, and valid_to.
 * Revocation always takes precedence.
 *
 * @param event - The attestation event to check
 * @param now - Unix timestamp to check against (defaults to current time)
 */
export function isValid(event: NostrEvent, now?: number): ValidityResult {
  const ts = now ?? Math.floor(Date.now() / 1000)

  // Revocation takes absolute precedence
  const status = findTag(event.tags, 'status')
  if (status === 'revoked') {
    return { valid: false, reason: 'revoked' }
  }

  // NIP-40 expiration
  const expirationStr = findTag(event.tags, 'expiration')
  if (expirationStr != null) {
    const expiration = Number(expirationStr)
    if (Number.isFinite(expiration) && ts >= expiration) {
      return { valid: false, reason: 'expired' }
    }
  }

  // Deferred activation (application-defined tag, checked as convenience)
  const validFromStr = findTag(event.tags, 'valid_from')
  if (validFromStr != null) {
    const validFrom = Number(validFromStr)
    if (Number.isFinite(validFrom) && ts < validFrom) {
      return { valid: false, reason: 'not-yet-active' }
    }
  }

  // Claim validity window (application-defined tag, checked as convenience)
  const validToStr = findTag(event.tags, 'valid_to')
  if (validToStr != null) {
    const validTo = Number(validToStr)
    if (Number.isFinite(validTo) && ts >= validTo) {
      return { valid: false, reason: 'claim-expired' }
    }
  }

  return { valid: true }
}
