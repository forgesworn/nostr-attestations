# Build Attestation Example

This example demonstrates NIP-VA (kind 31000) as a build and infrastructure provenance layer. A CI job or build server signs a Docker image digest against its source commit and publishes the attestation to a Nostr relay. Consumers can then fetch and verify those claims independently. No spec changes are needed -- kind 31000 handles software attestation exactly as designed, using the `provenance` type and a JSON content payload for build metadata.

## The attestation layer cake

Infrastructure provenance has three tiers of trust, each building on the last:

**Software attestation (this example)** -- "I built image X from commit Y." A human or machine identity signs a claim linking a Docker digest to a source commit. Trust depends on trusting the key.

**Reproducible builds (future, with Nix)** -- "Anyone can build image X from commit Y and get the same digest." A deterministic build system removes the need to trust the builder. Anyone can reproduce and verify the hash independently.

**Hardware attestation (future, with TPM/TEE)** -- "This machine is running attested image X." A trusted platform module or trusted execution environment proves that the running process matches the attested image, binding software trust to hardware trust.

All three tiers express their claims as kind 31000 events. The protocol does not change -- only the content payload and the type of key doing the signing.

## Prerequisites

- Node.js 22 or later
- The parent library built (`npm run build` from the repo root)

Install dependencies for this example:

```sh
cd examples/build-attestation
npm install
```

## Publish an attestation

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NSEC` | one of | -- | nsec1... bech32 or 64-char hex secret key |
| `BUNKER_URL` | one of | -- | `bunker://<pubkey>?relay=<relay>&secret=<secret>` |
| `IMAGE_DIGEST` | yes | -- | e.g. `sha256:abc123...` |
| `IMAGE_NAME` | yes | -- | e.g. `toll-booth/routing-proxy` |
| `SOURCE_REPO` | yes | -- | e.g. `https://github.com/forgesworn/toll-booth` |
| `SOURCE_COMMIT` | yes | -- | full git commit hash |
| `BUILD_TIMESTAMP` | no | current time | ISO 8601 build time |
| `RELAY_URL` | no | `wss://relay.damus.io` | relay to publish to |

### Sign with an nsec

```sh
NSEC=nsec1... \
IMAGE_DIGEST=sha256:abc123... \
IMAGE_NAME=toll-booth/routing-proxy \
SOURCE_REPO=https://github.com/forgesworn/toll-booth \
SOURCE_COMMIT=a1b2c3d4e5f6... \
npm run attest
```

### Sign via NIP-46 bunker

```sh
BUNKER_URL="bunker://<pubkey>?relay=wss://relay.example.com&secret=mysecret" \
IMAGE_DIGEST=sha256:abc123... \
IMAGE_NAME=toll-booth/routing-proxy \
SOURCE_REPO=https://github.com/forgesworn/toll-booth \
SOURCE_COMMIT=a1b2c3d4e5f6... \
npm run attest
```

## Fetch and verify

Provide the attestor's public key and the image name to fetch all matching attestations:

```sh
PUBKEY=npub1abc... IMAGE_NAME=toll-booth/routing-proxy npm run verify
```

Example output:

```
Build Attestation: toll-booth/routing-proxy
  Attestor:    npub1abc...
  Status:      valid
  Image:       sha256:abc123...
  Source:      https://github.com/forgesworn/toll-booth
  Commit:      a1b2c3d
  Built:       2026-03-27T14:30:00Z
  Attested:    2026-03-27T14:31:00Z
  Event ID:    note1xyz...
```

Multiple attestations are sorted newest first. Revoked attestations show `invalid (revoked)` in the status field.

## What this proves

NIP-VA handles infrastructure attestation without modification. The same kind 31000 event that carries social trust claims -- identity verification, skill endorsements, vouches -- carries build provenance claims. The `provenance` type signals the semantic purpose; the content payload carries the domain-specific data. There is no meaningful boundary between "social trust" and "infrastructure trust" at the protocol level. They are both attestations.

## What comes next

- **Reproducible builds with Nix** -- publish a kind 31000 event after a `nix build` whose output hash is deterministic. Third parties can reproduce the build and publish their own matching attestations, creating a web of independent verification.
- **Hardware attestation with TPM/TEE** -- a machine with a trusted platform module signs a kind 31000 event proving it is running a specific image. The signing key is bound to the hardware, not just the operator.
- **Automated CI publishing** -- a GitHub Actions workflow that publishes an attestation on every successful image push, using a bunker-backed key stored as a repository secret.
