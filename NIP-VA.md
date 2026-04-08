NIP-VA
======

Attestations
------------

`draft` `optional`

This NIP defines kind `31000`, an addressable event for attestations between Nostr identities. One kind serves credentials, endorsements, reviews, access grants, and any other attestation type — differentiated by a `type` tag or by reference to a first-person assertion event.

Motivation
----------

Several protocols on Nostr have converged on the same structural pattern: an addressable event where one pubkey makes a signed claim about another pubkey (or about itself). Each protocol invents its own event kind, leading to kind proliferation and missed interoperability.

Existing NIPs partially address this space but leave significant gaps:

- [NIP-58](58.md) (Badges) is display-oriented — no structured claims, no expiration, no revocation.
- [NIP-85](85.md) (Trusted Assertions) addresses trust computation over social graphs, not arbitrary typed claims between identities.
- [NIP-32](32.md) (Labelling) provides lightweight, non-addressable labels. Labels are regular events with no mechanism to revoke a specific label without deleting the entire event.

A single generic attestation kind allows identity verification, professional licensing, product provenance, peer endorsement, and trust management to share a common event structure. Applications define their own semantics through the `type` tag and application-specific tags.

The assertion-first pattern — where the subject publishes their own claim and third parties attest to it rather than making independent statements about them — emerged across multiple implementations before this NIP was drafted, approached from different problem domains.

Specification
-------------

### Event Kind

Kind `31000` (Attestation) — an addressable event per [NIP-01](01.md).

### Scope

This NIP defines the attestation **record format** only. It does not specify how attestations are requested, negotiated, or fulfilled. Workflow mechanics (who initiates an attestation, how requests are routed, how proficiency is declared) are application-defined and intentionally outside this spec.

Applications MAY use any workflow layer that suits their use case: automated issuance, user-initiated requests, DVM-based attestation services (NIP-90), or complex multi-step flows managed at the application layer. All of these can produce kind `31000` events as their output record.

Kind `31871` provides one such workflow layer, well-suited to event-verification scenarios with explicit request/response mechanics. Kind `31000` and kind `31871` are complementary: kind `31871` handles the workflow; kind `31000` is the record that workflow produces.

### Patterns

**Assertion-first (recommended).** The individual publishes their own claim as any Nostr event. The attestor validates it by referencing it via an `e` or `a` tag with the `"assertion"` marker. The type is inherited from the referenced event — no `type` tag is needed on the attestation. The subject defines the claim; the attestor confirms it.

**Direct claim.** The attestor defines the `type` tag and makes a standalone claim. Used for endorsements, reviews, access grants, and any case where the attestor originates the claim rather than validating someone else's.

![Assertion-first flow](https://raw.githubusercontent.com/forgesworn/nostr-attestations/main/assets/assertion-first-flow.svg)

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
| `effective` | `<unix-timestamp>` | No | When the revocation takes effect |

The `status` tag is used for lifecycle state. The only protocol-level value is `revoked`. Applications MAY define additional status values, but clients that do not understand a status value MUST treat the attestation as valid (non-revoked).

#### Custom Tags

Applications MAY define additional tags specific to their attestation types. Such tags are carried alongside the tags defined here.

The following application-level tags are used by the reference implementation and are documented here for interoperability. They are OPTIONAL and not part of the base protocol:

| Tag | Value | Description |
|-----|-------|-------------|
| `valid_from` | `<unix-timestamp>` | Deferred activation — attestation is not valid before this time |
| `valid_to` | `<unix-timestamp>` | Application-enforced validity end (distinct from NIP-40 `expiration`, which triggers relay-side deletion). Client-enforced only — relays store the event regardless of this value. |
| `occurred_at` | `<unix-timestamp>` | When the attested event occurred (distinct from `created_at`, which records when the attestation was published) |
| `schema` | `<URI>` | Machine-readable schema identifier for regulatory mapping or type disambiguation |
| `request` | `<event-reference>` | Reference to the event that prompted this attestation |
| `active-since` | `<unix-timestamp>` | When the verifier became professionally active (e.g. date of qualification or registration). SHOULD reflect the professional start date, not the Nostr event creation date. Cross-referenceable against professional registers. |
| `registry` | `<authority>`, `<id>` | Cleartext regulatory registry reference (e.g. `["registry", "sra", "123456"]`). Distinct from the `licence` tag, which stores a hash. |
| `registry-url` | `<URL>` | Optional direct URL to the verifier's public registry entry (e.g. `["registry-url", "https://www.sra.org.uk/consumers/register/123456/"]`). Companion to `registry`. |

When both `valid_from` and `valid_to` are present, `valid_to` MUST be greater than `valid_from`.

Verifiers SHOULD NOT be penalised in scoring or display for omitting the `registry` tag. Clients MUST NOT treat absence of a `registry` tag as a negative signal. This prevents coercion — verifiers who cannot or choose not to disclose their registry ID must not suffer reduced trust.

#### Assertion Marker

This NIP introduces `"assertion"` as a new marker value for `e` and `a` tags, following the positional convention of [NIP-10](10.md). The `"assertion"` value occupies index 3 (the fourth element) of the tag array. If no relay hint is available, index 2 MUST be an empty string (`""`) to preserve positional alignment. Using the existing `e`/`a` tag structure (rather than a new tag name) ensures that relay implementations already index these references — no relay changes are needed. The single new value is intentionally narrow: it marks exactly one referenced event as the subject's first-person claim being attested.

#### Discoverability Labels

Attestation publishers SHOULD include [NIP-32](32.md) labels for relay-side discoverability:

| Tag | Value | Condition |
|-----|-------|-----------|
| `L` | `nip-va` | Always |
| `l` | `<type-value>`, `nip-va` | When a `type` tag is present |

These labels allow clients to discover attestations via `{"#L": ["nip-va"]}` or filter by type via `{"#l": ["endorsement"]}` without relying on `d`-tag prefix matching. Pure assertion-first attestations without a `type` tag will not have an `l` label and cannot be filtered by type via `#l`; query by `#e` or `#a` instead.

### Content

Application-defined. MAY be empty, human-readable text, or JSON. Clients that do not understand the content SHOULD fall back to `summary`.

### d-tag Convention

![d-tag convention](https://raw.githubusercontent.com/forgesworn/nostr-attestations/main/assets/dtag-convention.svg)

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

### Type Conventions

Generic type values (`credential`, `endorsement`, `vouch`, `provenance`, `verifier`) are shared vocabulary and SHOULD be used when the attestation fits a common meaning. Applications that need domain-specific types SHOULD prefix them with a reverse-domain namespace to avoid collision:

```
com.example:professional-licence
io.example:wallet-verification
```

Generic types without a namespace prefix are considered shared and any application MAY use them. Namespaced types are owned by the declaring application and carry application-specific semantics.

### Revocation

To revoke, the publisher replaces the original event with an updated version including `["status", "revoked"]`. Addressable event semantics mean the revocation supersedes the original.

Revocation uses status replacement rather than [NIP-09](09.md) deletion because deletion removes evidence that an attestation ever existed. A revoked attestation is a verifiable state — clients can display "this credential was revoked" with the publisher's reason, which is materially different from "no credential found." Deletion is also a request, not a guarantee; relays MAY ignore it. Status replacement is deterministic: the latest version of the addressable event is authoritative.

Clients MUST check for `status: revoked` before treating any attestation as valid.

![attestation lifecycle](https://raw.githubusercontent.com/forgesworn/nostr-attestations/main/assets/lifecycle.svg)

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

![Verification flow](https://raw.githubusercontent.com/forgesworn/nostr-attestations/main/assets/verification-flow.svg)

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

The `"assertion"` marker on the `e` tag (index 3) distinguishes this from a generic event reference. The type is determined by the referenced assertion event.

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

When both `type` and an assertion reference are present, the `d` tag uses the assertion-first format while the `type` tag enables relay-side NIP-32 label filtering.

Relay Queries
-------------

```json
// All attestations about a subject
{"kinds": [31000], "#p": ["<subject-pubkey>"]}

// All attestations by a specific issuer
{"kinds": [31000], "authors": ["<issuer-pubkey>"]}

// All attestations of a specific type (via NIP-32 label)
{"kinds": [31000], "#l": ["endorsement"]}

// Attestations referencing a specific assertion event (assertion-first lookup)
{"kinds": [31000], "#e": ["<assertion-event-id>"]}

// Specific attestation (revocation check)
{"kinds": [31000], "authors": ["<issuer-pubkey>"], "#d": ["endorsement:<subject-pubkey>"]}
```

Note: Type-based queries use NIP-32 label filters (`#l`) rather than `#type`, because relay implementations reliably index `l` tags but MAY not index arbitrary custom tags.

Security Considerations
-----------------------

### Attestation Forgery

Requires key compromise. Clients SHOULD evaluate attestations by publisher trust, not treat any as inherently authoritative.

### Sybil Farming

Free keypairs mean free attestations. Defence: web-of-trust filtering per [NIP-02](02.md). Weight by social distance, not count. A single attestation from a followed pubkey is worth more than a thousand from unknown keys.

Applications that compute trust scores from attestations MUST enforce per-signal-type caps to prevent vouch farming. Without caps, a small number of colluding accounts can inflate scores beyond what a professional verification provides. See [Signet §4](https://github.com/forgesworn/signet/blob/main/spec/protocol.md#4-signet-iq-identification-quotient) for RECOMMENDED weights and MUST caps.

### Replay Across Contexts

The `type` and `d`-tag bind attestations to a specific context. An `endorsement` cannot be misinterpreted as a `credential`.

### Privacy

The `p` tag reveals the subject. For sensitive attestations, publishers SHOULD use [NIP-59](59.md) gift wrapping for private delivery.

### Relay Censorship

A relay can hide revocations. Clients MUST query multiple relays. The authoritative revocation state is the latest version of the addressable event, determined by `created_at`. Signature verification is always required — a revocation is only valid if signed by the original issuer's key. Do not rely on a single relay as the sole source of revocation state.

### Type Squatting

Attacker uses well-known type values with misleading semantics. Applications SHOULD use application-specific tags (e.g. schema URIs) for machine-readable disambiguation.

Relationship to Existing NIPs
-----------------------------

| Existing | Relationship |
|----------|-------------|
| [NIP-32](32.md) (Labels) | Labels (kind `1985`) are **regular** events; attestations (kind `31000`) are **addressable**. Labels have no "latest version wins" — queries return all labels ever published. Labels cannot be individually revoked without deleting the entire event. Labels carry no temporal validity. Attestations replace in-place, support granular revocation via `["status", "revoked"]`, and compose with [NIP-40](40.md) expiration. |
| [NIP-58](58.md) (Badges) | Badges are display-oriented — no structured claims, no expiration, no revocation. Attestations carry typed, structured, revocable claims. |
| [NIP-85](85.md) (Trusted Assertions) | NIP-85 outputs computed trust metrics over the social graph. Attestations record human claims. NIP-85 is downstream — it can ingest attestations as input data. |
| Kind 31871 (Community NIP) | Kind 31871 addresses a distinct problem: verifying whether a specific Nostr event is truthful or valid. It defines a four-kind system (attestation, request, recommendation, proficiency declaration) with a full state machine (`verifying`, `valid`, `invalid`, `revoked`) suited to event-verification workflows where strangers coordinate to assess event validity. NIP-VA addresses a different problem: making typed, addressable, revocable claims about pubkeys — credentials, endorsements, vouches, provenance. The `p` tag identifies a subject identity rather than an event. The two proposals operate at different levels: kind 31871 is a coordination protocol for event verification; kind 31000 is a record format for identity-centric claims. A kind 31871 workflow can produce a kind 31000 attestation as its outcome record. Kind 31871's proficiency declaration (kind 11871) and recommendation (kind 31873) solve attestor discovery for event verification; NIP-VA leaves equivalent discovery to the application layer. |
| NIP-91 / Service Attestations (38383–38384) | NIP-91 was closed and redirected to NIP-32. Service Attestations (kinds 38383–38384) address a narrower scope: service completion attestations with Namecoin anchoring. NIP-VA subsumes the attestation primitive (a signed claim about a pubkey) while leaving domain-specific features like blockchain anchoring to application profiles built on top. |
| TSM Assertion Services (37574–37576) | TSM assertions are computed outputs from trust service machines — algorithmic WoT scores, not human-originated claims. NIP-VA records first-person or third-party claims. The two are complementary: TSM services could ingest NIP-VA attestations as input signals for trust computation. |
| Agent Reputation Attestations (PR #2285, kind 30085) | Proposes structured reputation scoring specifically for AI agents. NIP-VA provides the general attestation layer (a signed claim about a pubkey); agent-specific scoring algorithms are application logic that can be expressed as NIP-VA attestation content or application-specific tags. |
| NIP-A1 Testimonials (PR #2198) | Proposes user endorsements via gift-wrapped signed events. NIP-VA's `endorsement` type covers the same use case with addressable semantics — endorsements are publicly discoverable, individually revocable, and queryable by relay filters, while gift-wrapped testimonials are private by default. The two serve different privacy models. |

HTTP Discovery (Informational)
------------------------------

Services running with NIP-VA provenance attestations MAY advertise them over HTTP using these conventions. This section is informational — not a protocol requirement.

### Response Header

    X-Nostr-Attestation: <hex-event-id>

Every HTTP response from an attested service includes this header. For direct attestations, the value is the attestation event ID. For assertion-first attestations, the value is the assertion event ID. The well-known endpoint disambiguates.

### Well-Known Endpoint

`GET /.well-known/nostr-attestation.json` returns a JSON object describing the service's attestation.

**Direct pattern** — the attestation is a first-party claim by an authority:

```json
{
  "pattern": "direct",
  "event_id": "<hex-event-id>",
  "relays": ["wss://relay.example.com"],
  "verify": "https://njump.me/nevent1..."
}
```

Verification: fetch the event by ID from a listed relay, verify the signature, parse with a NIP-VA library.

**Assertion-first pattern** — the service published a self-declaration, third parties attest to it:

```json
{
  "pattern": "assertion-first",
  "assertion_id": "<hex-assertion-event-id>",
  "relays": ["wss://relay.example.com"],
  "verify": "https://njump.me/nevent1..."
}
```

Verification: fetch the assertion event, then query for kind `31000` events with `#e` filter matching the assertion ID. Each result is a third-party attestation. Trust depends on who attested (web of trust), not how many.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pattern` | `"direct"` \| `"assertion-first"` | Yes | Verification flow |
| `event_id` | hex string | Direct only | Attestation event ID |
| `assertion_id` | hex string | Assertion-first only | Self-declaration event ID |
| `relays` | string[] | Yes | Relay URLs for fetching |
| `verify` | URL | No | Human-readable verification link |

Responses SHOULD include `Cache-Control: public, max-age=3600`. The attestation changes only on deploy.

### Signet Registry Discovery (`.well-known/signet.json`)

Applications using NIP-VA for identity verification (such as Signet) MAY publish institution metadata and staff rosters via `https://<domain>/.well-known/signet.json`. This enables domain-anchored trust: a credential issued by a pubkey listed in a regulated institution's `.well-known/signet.json` inherits trust from the institution's verified domain.

#### Version 1 Schema

```json
{
  "version": 1,
  "name": "Acme Legal LLP",
  "pubkeys": [
    {
      "id": "key-2026-01",
      "pubkey": "<64-char hex secp256k1 x-only pubkey>",
      "label": "Primary Verification Key",
      "created": "2026-01-01T00:00:00Z"
    }
  ],
  "relay": "wss://relay.example.com",
  "policy": { "rotation": "annual", "contact": "security@acmelegal.com" }
}
```

#### Version 2 Schema

Version 2 extends version 1 with entity type, registry cross-referencing, and staff pubkeys:

```json
{
  "version": 2,
  "name": "Baker & Co Solicitors",
  "entity": "juridical_person",
  "registry": {
    "authority": "sra",
    "id": "654321",
    "url": "https://www.sra.org.uk/consumers/register/organisation/?sraNumber=654321"
  },
  "pubkeys": [
    {
      "id": "firm-key-2026",
      "pubkey": "<64-char hex secp256k1 x-only pubkey>",
      "label": "Firm Verification Key",
      "created": "2026-01-15T00:00:00Z"
    }
  ],
  "staff": [
    {
      "pubkey": "<64-char hex>",
      "name": "Jane Smith",
      "role": "solicitor",
      "registry": { "authority": "sra", "id": "123456" }
    }
  ],
  "relay": "wss://relay.example.com",
  "policy": { "rotation": "annual", "contact": "compliance@bakerco.co.uk" }
}
```

#### Version 2 Fields

| Field | Type | Description |
|---|---|---|
| `entity` | string | Entity type: `juridical_person` or `juridical_persona` |
| `registry` | object | Regulatory body and registration ID for the institution |
| `registry.authority` | string | Registry identifier (e.g. `sra`, `gmc`, `gdc`, `arb`, `ofsted`, `companies-house`) |
| `registry.id` | string | The institution's registration ID on that registry |
| `registry.url` | string | Optional: direct URL to the institution's public registry entry |
| `staff` | array | Array of verified individuals at this institution |
| `staff[].pubkey` | string | 64-char hex secp256k1 x-only pubkey of the staff member |
| `staff[].name` | string | Display name (for human cross-referencing) |
| `staff[].role` | string | Role at the institution (e.g. `solicitor`, `gp`, `head-teacher`) |
| `staff[].registry` | object | Optional: the individual's own registry entry |

#### Validation Rules

- MUST use HTTPS — HTTP is rejected.
- `version` MUST be `1` or `2`. Clients MUST accept version 1 documents.
- `name` MUST be a non-empty string.
- `pubkeys` MUST be a non-empty array with at most 20 entries. Each `pubkey` value MUST be a 64-character lowercase hexadecimal string.
- Version 1 documents MUST NOT exceed 10,240 bytes (10 KB).
- Version 2 documents MUST NOT exceed 102,400 bytes (100 KB) to accommodate large staff rosters.
- `entity`, if present, MUST be `juridical_person` or `juridical_persona`.
- `staff`, if present, MUST be an array with at most 500 entries. Each `staff[].pubkey` MUST be a 64-character lowercase hexadecimal string.

#### Restricted Domains

For jurisdictions where institutional domains carry regulatory weight, implementations SHOULD limit domain-anchor trust to domains under regulated suffixes:

- `.sch.uk` — schools
- `.nhs.uk` — NHS organisations
- `.ac.uk` — academic institutions
- `.gov.uk` — government bodies

This is a RECOMMENDED heuristic, not a protocol requirement. Implementations targeting other jurisdictions SHOULD define their own restricted domain lists.

#### Caching and Rotation

Clients MAY cache the response for up to 24 hours. Clients SHOULD warn the user if the set of pubkeys changes unexpectedly between fetches (potential key compromise or rotation).

Implementation Evidence
-----------------------

This pattern emerged across six application domains before the NIP was drafted: identity verification (attestation types with ring signature proofs), professional licensing (regulatory credentials), service reputation (bilateral endorsements), product provenance (chain of custody), trust networks (peer endorsement graphs), and wallet verification (build reproducibility). A reference implementation exists with 166 tests and 20 frozen conformance vectors.

Known Limitations
-----------------

**Multi-party attestation.** Kind `31000` represents a single attestor's claim. Scenarios requiring consensus from multiple attestors (e.g. N-of-M credential approval) are not modelled at the protocol level. Applications requiring multi-party consensus SHOULD aggregate multiple kind `31000` events and apply their own threshold logic. Applications that require cryptographic multi-party proof without revealing individual signers MAY use ring signatures in the `content` field. A future extension may standardise threshold aggregation patterns.

**Pure assertion-first filtering.** Assertion-first attestations without a `type` tag have no `l` label and cannot be filtered by type via `#l`. Clients discovering these attestations SHOULD query by `#e` or `#a` with the assertion event ID.

Backwards Compatibility
-----------------------

This NIP introduces a new event kind. No existing events are affected. Clients that do not understand kind `31000` will ignore these events per [NIP-01](01.md) semantics.
