/** Unsigned event template returned by builders. */
export interface EventTemplate {
  kind: number
  tags: string[][]
  content: string
  created_at?: number
}

/** Signed Nostr event consumed by parsers and validators. */
export interface NostrEvent {
  kind: number
  pubkey: string
  created_at: number
  tags: string[][]
  content: string
  id: string
  sig: string
}

/** Reference to a first-person assertion event being attested. */
export interface AssertionRef {
  /** Event ID of the assertion (produces an e-tag with "assertion" marker). */
  id?: string
  /** Addressable event coordinate kind:pubkey:d-tag (produces an a-tag). */
  address?: string
  /** Relay hint for fetching the referenced event. */
  relay?: string
}

/** Parameters for creating an attestation event. */
export interface AttestationParams {
  /** Application-defined attestation type (must not contain colons). Optional when assertion is provided. */
  type?: string
  /** D-tag second segment: hex pubkey or context string. */
  identifier?: string
  /** P-tag: hex pubkey of the subject (for third-party attestations). */
  subject?: string
  /** Reference to a first-person assertion event being confirmed. */
  assertion?: AssertionRef
  /** Human-readable fallback for clients that do not understand the type. */
  summary?: string
  /** Unix timestamp for attestation expiry (NIP-40). */
  expiration?: number
  /** Unix timestamp for deferred activation (valid_from). */
  validFrom?: number
  /** Unix timestamp for validity window end (valid_to). */
  validTo?: number
  /** Reference to the event that prompted this attestation (opaque string, conventionally an addressable coordinate). */
  request?: string
  /** Machine-readable schema URI for regulatory mapping or application-profile identification. */
  schema?: string
  /** Unix timestamp for when the attested event occurred (distinct from created_at). */
  occurredAt?: number
  /** Additional application-specific tags. */
  tags?: string[][]
  /** Event content: empty string, human-readable text, or JSON. */
  content?: string
}

/** Parameters for creating a revocation event. */
export interface RevocationParams {
  /** Type of the attestation being revoked. Required for typed attestations. */
  type?: string
  /** D-tag second segment — must match the original attestation. Required for typed attestations. */
  identifier?: string
  /** P-tag — include if the original attestation had one. */
  subject?: string
  /** Event ID of the referenced assertion (for revoking assertion-only attestations). */
  assertionId?: string
  /** Addressable coordinate of the referenced assertion (for revoking assertion-only attestations). */
  assertionAddress?: string
  /** Human-readable revocation reason. */
  reason?: string
  /** Unix timestamp for when the revocation takes effect. */
  effective?: number
}

/** Parsed attestation data extracted from a NostrEvent. */
export interface Attestation {
  kind: 31000
  /** Attestation type. Value is "assertion" when the type is defined by a referenced assertion event. */
  type: string
  /** Attestor's pubkey (from outer event). */
  pubkey: string
  /** Event timestamp (from outer event). */
  createdAt: number
  /** D-tag second segment (pubkey or context string). */
  identifier: string | null
  /** P-tag value (hex pubkey of subject, if present). */
  subject: string | null
  /** Referenced assertion event ID (from e-tag with "assertion" marker). */
  assertionId: string | null
  /** Referenced assertion address (from a-tag with "assertion" marker). */
  assertionAddress: string | null
  /** Relay hint from the assertion reference tag. */
  assertionRelay: string | null
  summary: string | null
  expiration: number | null
  /** Earliest time the attestation is valid (deferred activation). */
  validFrom: number | null
  /** Latest time the attestation is valid (validity window end). */
  validTo: number | null
  /** Reference to the event that prompted this attestation. */
  request: string | null
  /** Machine-readable schema URI. */
  schema: string | null
  /** When the attested event occurred (distinct from createdAt). */
  occurredAt: number | null
  revoked: boolean
  reason: string | null
  /** All tags from the original event (for application-specific access). */
  tags: string[][]
  content: string
}

/** Result of structural validation. */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** Parameters for building a Nostr relay filter. */
export interface FilterParams {
  /** Filter by attestation type (uses type tag). */
  type?: string
  /** Filter by subject pubkey (p-tag). */
  subject?: string
  /** Filter by attestor pubkeys. */
  authors?: string[]
  /** Filter by schema URI. */
  schema?: string
}

/** Nostr relay filter object. */
export interface NostrFilter {
  kinds: number[]
  authors?: string[]
  '#p'?: string[]
  '#d'?: string[]
  '#l'?: string[]
  '#schema'?: string[]
}
