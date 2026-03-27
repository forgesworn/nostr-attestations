NIP-VA
======

Attestations
------------

`draft` `optional`

This NIP defines kind `31000`, an addressable event for attestations between Nostr identities. One kind serves credentials, endorsements, reviews, access grants, and any other attestation type — differentiated by a `type` tag or by reference to a first-person assertion event.

Motivation
----------

Several independent protocols on Nostr have converged on the same structural pattern: an addressable event where one pubkey makes a signed claim about another pubkey (or about itself). Each protocol invents its own event kind, leading to kind proliferation and missed interoperability. At least two independent proposals — one using kind 31000 with type-tag differentiation, another using kinds 31871–31873 with an assertion-first workflow — arrived at the same conclusion from different directions. This NIP incorporates lessons from both.

Existing NIPs partially address this space but leave significant gaps:

- [NIP-58](58.md) (Badges) is display-oriented — no structured claims, no expiration, no revocation.
- [NIP-85](85.md) (Trusted Assertions) covers computed social graph metrics, not arbitrary typed claims between identities.
- [NIP-32](32.md) (Labelling) provides lightweight, non-addressable labels. Labels are regular events with no mechanism to revoke a specific label without deleting the entire event.

A single generic attestation kind allows identity verification, professional licensing, product provenance, peer endorsement, and trust management to share a common event structure. Applications define their own semantics through the `type` tag and application-specific tags.

Specification
-------------

### Event Kind

Kind `31000` (Attestation) — an addressable event per [NIP-01](01.md).

### Patterns

**Assertion-first (recommended).** The individual publishes their own claim as any Nostr event. The attestor validates it by referencing it via an `e` or `a` tag with the `"assertion"` marker. The type is inherited from the referenced event — no `type` tag is needed on the attestation. This pattern puts the individual at the centre: they own their claim, the attestor merely stamps it.

**Direct claim.** The attestor defines the `type` tag and makes a standalone claim. Used for endorsements, reviews, access grants, and any case where the attestor originates the claim rather than validating someone else's.

### Tags

#### Required

| Tag | Value | Description |
|-----|-------|-------------|
| `d` | `<type>:<identifier>` or `assertion:<ref>` | Addressable identifier (see [d-tag convention](#d-tag-convention)) |

At least one of `type` or an assertion reference MUST be present:

| Tag | Value | Condition |
|-----|-------|-----------|
| `type` | `<string>` | REQUIRED when no assertion reference is present. OPTIONAL when an assertion reference is present. MUST NOT contain colons. The value `assertion` is reserved and MUST NOT be used as a type value. |
| `e` | `<event-id>`, `<relay>`, `"assertion"` | Reference to the subject's assertion event (see [Assertion Marker](#assertion-marker)). |
| `a` | `<kind>:<pubkey>:<d-tag>`, `<relay>`, `"assertion"` | Reference to an addressable assertion event. |

At most one `e` or `a` tag with the `"assertion"` marker per event (never both). Plain `e`/`a` tags without the `"assertion"` marker are permitted for general event references and do not trigger assertion-first semantics.

When both `type` and an assertion reference are present, the `d` tag MUST use the assertion-first format (`assertion:<ref>`). The `type` tag serves as an explicit type override for filtering and display, but does not change d-tag construction.

#### Conditionally Required

| Tag | Value | Condition |
|-----|-------|-----------|
| `p` | `<subject-pubkey>` | REQUIRED for third-party claims. SHOULD be omitted for self-declarations. |

#### Recommended

| Tag | Value | Description |
|-----|-------|-------------|
| `expiration` | `<unix-timestamp>` | Per [NIP-40](40.md) |
| `summary` | `<human-readable>` | Display fallback for clients that do not understand the type |

#### Revocation

| Tag | Value | Required | Description |
|-----|-------|----------|-------------|
| `status` | `revoked` | Yes | Publisher withdraws the claim |
| `reason` | `<human-readable>` | No | Why it was revoked |

The `status` tag is used for lifecycle state. The only protocol-level value is `revoked`. Applications MAY define additional status values, but clients that do not understand a status value MUST treat the attestation as valid (non-revoked).

#### Custom Tags

Applications MAY define additional tags specific to their attestation types. Such tags are carried alongside the tags defined here. Validity windows, schema URIs, request references, and other domain-specific metadata are application concerns — not part of the base protocol.

#### Assertion Marker

This NIP introduces `"assertion"` as a new marker value for `e` and `a` tags, following the same positional convention as [NIP-10](10.md)'s `reply`, `root`, and `mention` markers. Using the existing `e`/`a` tag structure (rather than a new tag name) ensures that relay implementations already index these references — no relay changes are needed. The single new value is intentionally narrow: it marks exactly one referenced event as the subject's first-person claim being attested.

#### Discoverability Labels

Attestation publishers SHOULD include [NIP-32](32.md) labels for relay-side discoverability:

| Tag | Value | Condition |
|-----|-------|-----------|
| `L` | `nip-va` | Always |
| `l` | `<type-value>`, `nip-va` | When a `type` tag is present |

These labels allow clients to discover attestations via `{"#L": ["nip-va"]}` or filter by type via `{"#l": ["endorsement"]}` without relying on `d`-tag prefix matching.

### Content

Application-defined. MAY be empty, human-readable text, or JSON. Clients that do not understand the content SHOULD fall back to `summary`.

### d-tag Convention

```mermaid
graph LR
    subgraph "Assertion-first"
        AF1["d: assertion:abc123"]
        AF2["d: assertion:30023:def456:my-claim"]
    end

    subgraph "Direct claim"
        DC1["d: endorsement:&lt;subject-pubkey&gt;"]
        DC2["d: verifier:notary"]
    end

    AF1 -.- |"ref = event ID\nor coordinate"| AF2
    DC1 -.- |"type:identifier"| DC2
```

**Assertion-first:** `assertion:<ref>`
- `<ref>` is the event ID (for `e`-tag assertions) or addressable coordinate (for `a`-tag assertions) being attested.
- Example: `assertion:abc123` or `assertion:30023:def456:my-claim`

**Direct claim:** `<type>:<identifier>`
- `<type>` matches the `type` tag value. MUST NOT contain colons. The first colon is the delimiter.
- `<identifier>` for third-party claims: typically the subject's hex pubkey.
- `<identifier>` for self-declarations: application-defined. Applications MUST document their identifier convention. When no application convention exists, the publisher's own hex pubkey is RECOMMENDED as a default to preserve the "one per publisher per type" guarantee.
- Example: `endorsement:abc123` or `verifier:notary`

Guarantees:

1. **One per publisher per claim.** Addressable semantics mean latest version wins.
2. **Relay-side filtering.** Query by `d`-tag prefix for all attestations of a type.
3. **No collisions.** Different types and assertion references occupy separate `d`-tag slots.

### Revocation

To revoke, the publisher replaces the original event with an updated version including `["status", "revoked"]`. Addressable event semantics mean the revocation supersedes the original.

Revocation uses status replacement rather than [NIP-09](09.md) deletion because deletion removes evidence that an attestation ever existed. A revoked attestation is a verifiable state — clients can display "this credential was revoked" with the publisher's reason, which is materially different from "no credential found." Deletion is also a request, not a guarantee; relays MAY ignore it. Status replacement is deterministic: the latest version of the addressable event is authoritative.

Clients MUST check for `status: revoked` before treating any attestation as valid.

```mermaid
stateDiagram-v2
    [*] --> Active : publisher signs & publishes
    Active --> Active : publisher updates (same d-tag)
    Active --> Revoked : publisher adds ["status", "revoked"]
    Active --> Expired : expiration timestamp passes
    Revoked --> [*]
    Expired --> [*]

    note right of Active : addressable event —\nlatest version wins
    note right of Revoked : revocation supersedes\nexpiration
```

### Verification Flow

```
1. Client queries: {"kinds": [31000], "#p": ["<subject>"]}
2. For each event: check status != revoked
3. Check expiration not passed (NIP-40)
4. If assertion-first (e/a tag with "assertion" marker):
   a. Fetch the referenced assertion event from relay hint
   b. Verify the assertion event exists and is authored by the subject
   c. If the referenced event cannot be found, treat the attestation
      as unverifiable (client MAY display with a warning)
5. Evaluate publisher trust (web-of-trust)
6. Parse application-specific tags
```

### Self-attestation Discovery

Self-attestations have no `p` tag. To discover them, clients SHOULD use NIP-32 labels:

```json
{"kinds": [31000], "authors": ["<pubkey>"], "#L": ["nip-va"]}
```

This returns all attestations by the pubkey. Clients filter client-side by `type` tag or d-tag prefix for specific attestation types.

Where a relay supports `d`-tag prefix matching, a more precise query is possible:

```json
{"kinds": [31000], "authors": ["<pubkey>"], "#d": ["verifier:"]}
```

Clients MUST NOT rely on prefix matching alone, as relay support varies.

Examples
--------

### Assertion-first (individual at the centre)

A verifier attests to the validity of a subject's own claim:

```json
{
  "id": "<32-bytes-hex>",
  "kind": 31000,
  "pubkey": "<verifier-pubkey>",
  "created_at": 1711500000,
  "tags": [
    ["d", "assertion:<subject-event-id>"],
    ["e", "<subject-event-id>", "wss://relay.example.com", "assertion"],
    ["p", "<subject-pubkey>"],
    ["L", "nip-va"],
    ["summary", "Identity claim verified in person"]
  ],
  "content": "",
  "sig": "<64-bytes-hex>"
}
```

The `"assertion"` marker on the `e` tag distinguishes this from a generic event reference. The type is determined by the referenced assertion event.

### Direct claim (endorsement)

One identity endorses another based on direct experience:

```json
{
  "id": "<32-bytes-hex>",
  "kind": 31000,
  "pubkey": "<endorser-pubkey>",
  "created_at": 1711500000,
  "tags": [
    ["d", "endorsement:<subject-pubkey>"],
    ["type", "endorsement"],
    ["p", "<subject-pubkey>"],
    ["L", "nip-va"],
    ["l", "endorsement", "nip-va"],
    ["summary", "Reliable provider, completed 12 transactions"]
  ],
  "content": "",
  "sig": "<64-bytes-hex>"
}
```

### Revocation

The original publisher withdraws a previously issued endorsement:

```json
{
  "id": "<32-bytes-hex>",
  "kind": 31000,
  "pubkey": "<endorser-pubkey>",
  "created_at": 1711600000,
  "tags": [
    ["d", "endorsement:<subject-pubkey>"],
    ["type", "endorsement"],
    ["p", "<subject-pubkey>"],
    ["L", "nip-va"],
    ["l", "endorsement", "nip-va"],
    ["status", "revoked"],
    ["reason", "fraudulent activity detected"]
  ],
  "content": "",
  "sig": "<64-bytes-hex>"
}
```

### Assertion-first with explicit type (hybrid)

The attestor references a first-person assertion and adds an explicit type for relay-side filtering:

```json
{
  "id": "<32-bytes-hex>",
  "kind": 31000,
  "pubkey": "<verifier-pubkey>",
  "created_at": 1711500000,
  "tags": [
    ["d", "assertion:<subject-event-id>"],
    ["e", "<subject-event-id>", "wss://relay.example.com", "assertion"],
    ["type", "credential"],
    ["p", "<subject-pubkey>"],
    ["L", "nip-va"],
    ["l", "credential", "nip-va"],
    ["summary", "Professional licence verified"]
  ],
  "content": "",
  "sig": "<64-bytes-hex>"
}
```

The `type` tag enables `#type` queries while the `d` tag uses the assertion-first format.

Relay Queries
-------------

```json
// All attestations about a subject
{"kinds": [31000], "#p": ["<subject-pubkey>"]}

// All attestations by a specific issuer
{"kinds": [31000], "authors": ["<issuer-pubkey>"]}

// All attestations of a specific type (via NIP-32 label)
{"kinds": [31000], "#l": ["endorsement"]}

// Specific attestation (revocation check)
{"kinds": [31000], "authors": ["<issuer-pubkey>"], "#d": ["endorsement:<subject-pubkey>"]}
```

Security Considerations
-----------------------

### Attestation Forgery

Requires key compromise. Clients SHOULD evaluate attestations by publisher trust, not treat any as inherently authoritative.

### Sybil Farming

Free keypairs mean free attestations. Defence: web-of-trust filtering per [NIP-02](02.md). Weight by social distance, not count. A single attestation from a followed pubkey is worth more than a thousand from unknown keys.

### Replay Across Contexts

The `type` and `d`-tag bind attestations to a specific context. An `endorsement` cannot be misinterpreted as a `credential`.

### Privacy

The `p` tag reveals the subject. For sensitive attestations, publishers SHOULD use [NIP-59](59.md) gift wrapping for private delivery.

### Relay Censorship

A relay can hide revocations. Clients MUST query multiple relays. Treat as revoked if ANY relay returns the revocation.

### Type Squatting

Attacker uses well-known type values with misleading semantics. Applications SHOULD use application-specific tags (e.g. schema URIs) for machine-readable disambiguation.

Relationship to Existing NIPs
-----------------------------

| Existing | Relationship |
|----------|-------------|
| [NIP-32](32.md) (Labels) | Labels (kind `1985`) are **regular** events. Attestations (kind `31000`) are **addressable** events. This creates four structural differences: (1) Labels have no "latest version wins" — a query returns every label ever published, not the current state. Attestations replace in-place: one event per publisher per d-tag. (2) Labels cannot be individually revoked — deleting a label event ([NIP-09](09.md)) removes all labels in that event, not a specific one. Attestations support granular revocation via `["status", "revoked"]` on the specific d-tag. (3) Labels have no scoped d-tag — there is no way to query "the current label from pubkey X about subject Y of type Z." Attestation d-tags (`<type>:<identifier>` or `assertion:<ref>`) give exactly this. (4) Labels carry no temporal validity — no expiration, no validity windows, no lifecycle. Attestations compose with [NIP-40](40.md) expiration and support status-based lifecycle. Labels are observations; attestations are living, updatable, revocable claims. |
| [NIP-58](58.md) (Badges) | Badges are display-oriented — no structured claims, no expiration, no revocation. Attestations carry typed, structured, revocable claims. |
| [NIP-85](85.md) (Trusted Assertions) | NIP-85 outputs computed metrics. Attestations record human claims. NIP-85 is downstream — it can ingest attestations as input data. |
| Kind 31871 (Community NIP) | Same problem space, complementary philosophy. 31871 excels at assertion-first verification workflows. This NIP generalises the assertion-first pattern to also cover direct claims on a single kind. |

Implementation Evidence
-----------------------

This pattern emerged independently across six application domains before the NIP was drafted: identity verification (attestation types with ring signature proofs), professional licensing (regulatory credentials), service reputation (bilateral endorsements), product provenance (chain of custody), trust networks (peer endorsement graphs), and wallet verification (build reproducibility). Two independent reference implementations exist with a combined 150+ tests and 20 frozen conformance vectors.

Backwards Compatibility
-----------------------

This NIP introduces a new event kind. No existing events are affected. Clients that do not understand kind `31000` will ignore these events per [NIP-01](01.md) semantics.
