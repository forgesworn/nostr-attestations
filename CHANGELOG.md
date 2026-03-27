# [2.4.0](https://github.com/forgesworn/nostr-attestations/compare/v2.3.1...v2.4.0) (2026-03-27)


### Bug Fixes

* use simple relay filter, fix type issues in verify.ts ([123b70b](https://github.com/forgesworn/nostr-attestations/commit/123b70bb28804076535e1f197acafaa88e8ce565))


### Features

* add attest.ts — provenance attestation script for Docker image builds ([3a52fb7](https://github.com/forgesworn/nostr-attestations/commit/3a52fb77e77b2421da804c44a58e7722ef87d916))
* add attest.ts and verify.ts build attestation scripts ([a08a072](https://github.com/forgesworn/nostr-attestations/commit/a08a07255ac5bfcd9aec90fafa5574ec23c42dd1))
* add verify.ts to build-attestation example ([9f89183](https://github.com/forgesworn/nostr-attestations/commit/9f891838a2221a11b7f9fa075a305b847f9b577f))
* scaffold build-attestation example directory ([420d47e](https://github.com/forgesworn/nostr-attestations/commit/420d47ea5d541fcc642b4ad883a8a699056c8a91))

## [2.3.1](https://github.com/forgesworn/nostr-attestations/compare/v2.3.0...v2.3.1) (2026-03-27)


### Bug Fixes

* harden input validation — reserved tag injection, hex checks, assertion type guard ([83a944a](https://github.com/forgesworn/nostr-attestations/commit/83a944a9b3e26bbc906788f0c76d671dde466995))

# [2.3.0](https://github.com/forgesworn/nostr-attestations/compare/v2.2.0...v2.3.0) (2026-03-27)


### Features

* harden NIP-VA for upstream review ([da6d436](https://github.com/forgesworn/nostr-attestations/commit/da6d43699522362ca1d3350965f6e6b52ba8f6a4)), closes [#1](https://github.com/forgesworn/nostr-attestations/issues/1)

# [2.2.0](https://github.com/forgesworn/nostr-attestations/compare/v2.1.0...v2.2.0) (2026-03-25)


### Bug Fixes

* assertion d-tag takes precedence in hybrid case ([0ff16bc](https://github.com/forgesworn/nostr-attestations/commit/0ff16bc0de942f01be2e006d1195d9a03c545c76))
* reserve 'assertion' as forbidden type value ([e013aab](https://github.com/forgesworn/nostr-attestations/commit/e013aab58a55feea9e9266690c38d53319ad5a4a))
* validator enforces assertion: d-tag when assertion ref present ([7071427](https://github.com/forgesworn/nostr-attestations/commit/7071427756f22b9683f4f51c98425ca79bf5743b))


### Features

* add isValid() convenience helper for attestation validity checks ([b87e79c](https://github.com/forgesworn/nostr-attestations/commit/b87e79cbc2de2983277bfe8460637d4c79fa2d3b))
* merged attestation NIP — assertion-first, hybrid d-tag, isValid helper, 20 vectors ([863d3e3](https://github.com/forgesworn/nostr-attestations/commit/863d3e370efe76156b33f58a9c088f461362d890))

# [2.1.0](https://github.com/forgesworn/nostr-attestations/compare/v2.0.0...v2.1.0) (2026-03-23)


### Features

* add NIP-32 labels and occurred_at temporal context ([17f0aec](https://github.com/forgesworn/nostr-attestations/commit/17f0aec29eed60ce19bb77e2dd74e31afa4b3963))

# [2.0.0](https://github.com/forgesworn/nostr-attestations/compare/v1.0.1...v2.0.0) (2026-03-23)


* feat!: assertion-first pattern, validity windows, schema tags ([9a69f7d](https://github.com/forgesworn/nostr-attestations/commit/9a69f7d4e3a11b42e1e9d1312ca3b9bb8b318737))


### BREAKING CHANGES

* Attestation.type is now string | null (was string).
Null when type is inferred from a referenced assertion event.

- Support assertion-first attestation pattern via e/a tags with
  "assertion" marker — the subject makes a claim, the attestor
  attests to it
- type tag conditionally required: must have type OR assertion ref
- d-tag uses assertion: prefix for assertion-only attestations
- Add valid_to tag for validity window end (distinct from expiration)
- Add request tag linking to prompting event
- Add schema tag for machine-readable schema URIs (eIDAS, W3C VC)
- Add assertionRelay to parsed Attestation interface
- Extend createRevocation for assertion-only attestations
- Add buildAssertionDTag and extend parseDTag for assertion: prefix
- Add schema filter to attestationFilter
- Extend revocationFilter with assertion-only overload
- Add /types subpath export for zero-runtime type imports
- 6 new conformance test vectors (16 total)
- 129 tests passing

## [1.0.1](https://github.com/forgesworn/nostr-attestations/compare/v1.0.0...v1.0.1) (2026-03-20)


### Bug Fixes

* correct nak commands in verification walkthrough ([845b88a](https://github.com/forgesworn/nostr-attestations/commit/845b88a5b07a346dc9661e3c8909b26b47fd97b0))
* remove unindexed tag filter from endorsement query ([8fe314d](https://github.com/forgesworn/nostr-attestations/commit/8fe314dd75a7a6611db2029ab76478f6d1935bc8))

# 1.0.0 (2026-03-20)


### Bug Fixes

* correct copyright to TheCryptoDonkey ([80ddea3](https://github.com/forgesworn/nostr-attestations/commit/80ddea36aec28c760fef71c3de208e3b2fefa1b0))
* correct copyright to TheCryptoDonkey ([635ab25](https://github.com/forgesworn/nostr-attestations/commit/635ab25e585b542df7a432dbb55c484aabf5e958))
* input validation hardening from security audit ([a3ff51b](https://github.com/forgesworn/nostr-attestations/commit/a3ff51bfbc1a10d3b2b9b4d32ead7f3bd3bea9d0))


### Features

* add 10 frozen test vectors ([f5d55d5](https://github.com/forgesworn/nostr-attestations/commit/f5d55d5a614fea57fadbc71432e70d8a6820690c))
* add attestation and revocation builders ([b9e8204](https://github.com/forgesworn/nostr-attestations/commit/b9e8204c508dad7684966acf22c9de29f9d62b15))
* add attestation parser and revocation checker ([1c3c157](https://github.com/forgesworn/nostr-attestations/commit/1c3c1570a6de3db12c3c4a9dacd35a3594e63ee1))
* add barrel exports ([4fa7f7e](https://github.com/forgesworn/nostr-attestations/commit/4fa7f7e4a09958771eb95f143b19c39298e8752d))
* add d-tag helpers and filter builders ([ed712a6](https://github.com/forgesworn/nostr-attestations/commit/ed712a6724e20539b727d0f978cc9c64fee1e87e))
* add structural validator ([07775b6](https://github.com/forgesworn/nostr-attestations/commit/07775b6a47e1c0855e420771efaa2dfb0cd9bc88))
* add type definitions, constants, and internal helpers ([abbee89](https://github.com/forgesworn/nostr-attestations/commit/abbee89a47579b1003f7fb8309fec2c69df0f843))
* add valid_from support for deferred attestation activation ([5c184c1](https://github.com/forgesworn/nostr-attestations/commit/5c184c1f646efa254de012439e62474032c05fb1))
* harden NIP-VA spec for community submission ([e6b2f98](https://github.com/forgesworn/nostr-attestations/commit/e6b2f98d688d578eb41bef5d0fb7babccac6084b))
