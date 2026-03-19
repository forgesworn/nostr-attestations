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

/** Parameters for creating an attestation event. */
export interface AttestationParams {
  /** Application-defined attestation type (must not contain colons). */
  type: string
  /** D-tag second segment: hex pubkey or context string. */
  identifier?: string
  /** P-tag: hex pubkey of the subject (for third-party attestations). */
  subject?: string
  /** Human-readable fallback for clients that do not understand the type. */
  summary?: string
  /** Unix timestamp for attestation expiry (NIP-40). */
  expiration?: number
  /** Additional application-specific tags. */
  tags?: string[][]
  /** Event content: empty string, human-readable text, or JSON. */
  content?: string
}

/** Parameters for creating a revocation event. */
export interface RevocationParams {
  /** Type of the attestation being revoked. */
  type: string
  /** D-tag second segment — must match the original attestation. */
  identifier: string
  /** P-tag — include if the original attestation had one. */
  subject?: string
  /** Human-readable revocation reason. */
  reason?: string
  /** Unix timestamp for when the revocation takes effect. */
  effective?: number
}

/** Parsed attestation data extracted from a NostrEvent. */
export interface Attestation {
  kind: 31000
  type: string
  /** Attestor's pubkey (from outer event). */
  pubkey: string
  /** Event timestamp (from outer event). */
  createdAt: number
  /** D-tag second segment (pubkey or context string). */
  identifier: string | null
  /** P-tag value (hex pubkey of subject, if present). */
  subject: string | null
  summary: string | null
  expiration: number | null
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
}

/** Nostr relay filter object. */
export interface NostrFilter {
  kinds: number[]
  authors?: string[]
  '#p'?: string[]
  '#d'?: string[]
  '#type'?: string[]
}
