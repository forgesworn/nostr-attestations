/** NIP-VA Verifiable Attestation event kind (addressable). */
export const ATTESTATION_KIND = 31000 as const

/**
 * Well-known attestation type constants.
 * Applications may define their own types beyond these.
 */
export const TYPES = {
  CREDENTIAL: 'credential',
  ENDORSEMENT: 'endorsement',
  VOUCH: 'vouch',
  VERIFIER: 'verifier',
  PROVENANCE: 'provenance',
  REVOCATION: 'revocation',
} as const
