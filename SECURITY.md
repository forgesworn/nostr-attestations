# Security Policy

## Scope

This package (`nostr-attestations`) is a zero-dependency, zero-network library. It does pure data transformation — building, parsing, and validating Nostr event structures in memory. It does not make network requests, perform cryptographic operations, or handle private keys.

The attack surface is therefore narrow: malformed or adversarially crafted input that could cause unexpected behaviour in the builders, parsers, or validators.

## Supported Versions

The latest release on the `main` branch is supported. Older minor versions are not patched; upgrade to the latest release.

| Version | Supported |
|---------|-----------|
| `2.x`   | Yes       |
| `1.x`   | No        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security concerns.**

Report via Nostr DM to `npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2` (NIP-44 encrypted, preferred), or by email to the maintainer address in the npm registry.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix if you have one

Expect an acknowledgement within 72 hours and a patch within 14 days for confirmed issues.

## Security Considerations for Callers

The NIP-VA specification documents several trust model considerations. Library callers should be aware of:

**Signature verification is the caller's responsibility.** `parseAttestation()` and `validateAttestation()` do not verify Nostr event signatures. Always verify signatures with your signing library (nostr-tools, NDK, etc.) before trusting parsed data.

**Revocation requires a relay query.** `isRevoked()` checks an already-fetched event, not a relay. To check whether an attestation has been revoked, query the relay with `revocationFilter()` to fetch the latest version of the addressable event, then check `isRevoked()` on the result.

**Sybil resistance requires web-of-trust filtering.** Anyone can publish a kind 31000 event. Weight attestations by the publisher's position in your social graph, not by count. A single endorsement from a trusted pubkey is worth more than many from unknown keys.

**Relay censorship of revocations.** A relay may suppress revocation events. Query multiple relays and treat an attestation as revoked if any relay returns a revoked version.

**Type squatting.** An attacker may use well-known type values (`credential`, `endorsement`) with misleading content. Use `schema` tags with explicit schema URIs for machine-readable disambiguation in high-stakes contexts.
