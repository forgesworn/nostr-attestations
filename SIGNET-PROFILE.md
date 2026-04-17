Signet Application Profile
==========================

This document defines the Signet application profile for [NIP-VA](./NIP-VA.md) attestations. It covers domain-specific tags for identity verification, registry cross-referencing, and institution discovery via `.well-known/signet.json`.

This profile is maintained by the [Signet](https://github.com/forgesworn/signet) project and is not part of the NIP-VA base protocol.

Application Tags
-----------------

The following tags extend kind `31000` attestations for identity verification and professional licensing use cases. They are OPTIONAL and carried alongside the base NIP-VA tags.

| Tag | Value | Description |
|-----|-------|-------------|
| `active-since` | `<unix-timestamp>` | When the verifier became professionally active (e.g. date of qualification or registration). SHOULD reflect the professional start date, not the Nostr event creation date. Cross-referenceable against professional registers. |
| `registry` | `<authority>`, `<id>` | Cleartext regulatory registry reference (e.g. `["registry", "sra", "123456"]`). Distinct from the `licence` tag, which stores a hash. |
| `registry-url` | `<URL>` | Optional direct URL to the verifier's public registry entry (e.g. `["registry-url", "https://www.sra.org.uk/consumers/register/123456/"]`). Companion to `registry`. |

Verifiers SHOULD NOT be penalised in scoring or display for omitting the `registry` tag. Clients MUST NOT treat absence of a `registry` tag as a negative signal. This prevents coercion -- verifiers who cannot or choose not to disclose their registry ID must not suffer reduced trust.

Registry Discovery (`.well-known/signet.json`)
-----------------------------------------------

Applications using NIP-VA for identity verification MAY publish institution metadata and staff rosters via `https://<domain>/.well-known/signet.json`. This enables domain-anchored trust: a credential issued by a pubkey listed in a regulated institution's `signet.json` inherits trust from the institution's verified domain.

### Version 1 Schema

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

### Version 2 Schema

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

### Version 2 Fields

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

### Validation Rules

- MUST use HTTPS -- HTTP is rejected.
- `version` MUST be `1` or `2`. Clients MUST accept version 1 documents.
- `name` MUST be a non-empty string.
- `pubkeys` MUST be a non-empty array with at most 20 entries. Each `pubkey` value MUST be a 64-character lowercase hexadecimal string.
- Version 1 documents MUST NOT exceed 10,240 bytes (10 KB).
- Version 2 documents MUST NOT exceed 102,400 bytes (100 KB) to accommodate large staff rosters.
- `entity`, if present, MUST be `juridical_person` or `juridical_persona`.
- `staff`, if present, MUST be an array with at most 500 entries. Each `staff[].pubkey` MUST be a 64-character lowercase hexadecimal string.

### Restricted Domains

For jurisdictions where institutional domains carry regulatory weight, implementations SHOULD limit domain-anchor trust to domains under regulated suffixes:

- `.sch.uk` -- schools
- `.nhs.uk` -- NHS organisations
- `.ac.uk` -- academic institutions
- `.gov.uk` -- government bodies

This is a RECOMMENDED heuristic, not a protocol requirement. Implementations targeting other jurisdictions SHOULD define their own restricted domain lists.

### Caching and Rotation

Clients MAY cache the response for up to 24 hours. Clients SHOULD warn the user if the set of pubkeys changes unexpectedly between fetches (potential key compromise or rotation).
