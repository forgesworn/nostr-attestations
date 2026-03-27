/// <reference types="node" />

/**
 * Build Attestation Example
 *
 * Creates a kind 31000 provenance attestation for a Docker image build,
 * signs it, and publishes to a Nostr relay.
 *
 * Required env vars:
 *   NSEC or BUNKER_URL  — signing method (one required)
 *   IMAGE_DIGEST        — e.g. sha256:abc123...
 *   IMAGE_NAME          — e.g. toll-booth/routing-proxy
 *   SOURCE_REPO         — e.g. https://github.com/forgesworn/toll-booth
 *   SOURCE_COMMIT       — git commit hash
 *
 * Optional env vars:
 *   RELAY_URL           — defaults to wss://relay.damus.io
 *   BUILD_TIMESTAMP     — ISO 8601, defaults to current time
 */

import { createAttestation, TYPES } from 'nostr-attestations'
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'
import * as nip19 from 'nostr-tools/nip19'
import { BunkerSigner, parseBunkerInput } from 'nostr-tools/nip46'

// ---------------------------------------------------------------------------
// Env var validation
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) {
    console.error(`Error: environment variable ${name} is required`)
    process.exit(1)
  }
  return val
}

const nsecRaw = process.env['NSEC']
const bunkerUrl = process.env['BUNKER_URL']

if (!nsecRaw && !bunkerUrl) {
  console.error(
    'Error: one of NSEC or BUNKER_URL must be set.\n' +
      '  NSEC      — nsec1... bech32 or 64-char hex secret key\n' +
      '  BUNKER_URL — bunker://<pubkey>?relay=<relay>&secret=<secret>',
  )
  process.exit(1)
}

const relayUrl = process.env['RELAY_URL'] ?? 'wss://relay.damus.io'
const imageDigest = requireEnv('IMAGE_DIGEST')
const imageName = requireEnv('IMAGE_NAME')
const sourceRepo = requireEnv('SOURCE_REPO')
const sourceCommit = requireEnv('SOURCE_COMMIT')
const buildTimestamp = process.env['BUILD_TIMESTAMP'] ?? new Date().toISOString()

// ---------------------------------------------------------------------------
// Build the attestation event template
// ---------------------------------------------------------------------------

const template = createAttestation({
  type: TYPES.PROVENANCE,
  identifier: imageName,
  summary: `Build attestation for ${imageName} from ${sourceCommit.slice(0, 7)}`,
  content: JSON.stringify({
    image: imageDigest,
    name: imageName,
    source: sourceRepo,
    commit: sourceCommit,
    built: buildTimestamp,
  }),
})

// created_at must be set before signing
const eventTemplate = {
  ...template,
  created_at: Math.floor(Date.now() / 1000),
}

// ---------------------------------------------------------------------------
// Sign and publish
// ---------------------------------------------------------------------------

async function main() {
  let signedEvent: ReturnType<typeof finalizeEvent>
  let attestorPubkeyHex: string

  if (nsecRaw) {
    // --- nsec / hex signing ---
    let secretKey: Uint8Array

    if (nsecRaw.startsWith('nsec1')) {
      const { data } = nip19.decode(nsecRaw)
      secretKey = data as unknown as Uint8Array
    } else {
      // Assume raw hex
      if (!/^[0-9a-fA-F]{64}$/.test(nsecRaw)) {
        console.error('Error: NSEC must be an nsec1... bech32 string or a 64-char hex secret key')
        process.exit(1)
      }
      secretKey = Buffer.from(nsecRaw, 'hex')
    }

    attestorPubkeyHex = getPublicKey(secretKey)
    signedEvent = finalizeEvent(eventTemplate, secretKey)
  } else {
    // --- NIP-46 bunker signing ---
    const bunkerParams = await parseBunkerInput(bunkerUrl!)
    if (!bunkerParams) {
      throw new Error('Could not parse BUNKER_URL — expected bunker://<pubkey>?relay=<relay>&secret=<secret>')
    }

    if (!bunkerParams.relays || bunkerParams.relays.length === 0) {
      throw new Error('BUNKER_URL must include at least one relay= parameter')
    }

    const clientSecretKey = generateSecretKey()
    const signer = BunkerSigner.fromBunker(clientSecretKey, bunkerParams)

    attestorPubkeyHex = await signer.getPublicKey()

    // BunkerSigner.signEvent expects an unsigned event template with pubkey pre-populated
    const unsignedWithPubkey = {
      ...eventTemplate,
      pubkey: attestorPubkeyHex,
    }
    signedEvent = await signer.signEvent(unsignedWithPubkey)

    signer.close()
  }

  // ---------------------------------------------------------------------------
  // Publish to relay
  // ---------------------------------------------------------------------------

  const pool = new SimplePool()

  const publishPromises = pool.publish([relayUrl], signedEvent)

  try {
    await Promise.all(publishPromises)
  } catch (err) {
    console.error('Warning: relay publish error:', err)
    // Non-fatal — still print the event details
  } finally {
    pool.destroy()
  }

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------

  const eventNote = nip19.noteEncode(signedEvent.id)
  const attestorNpub = nip19.npubEncode(attestorPubkeyHex)

  console.log()
  console.log('Attestation published successfully')
  console.log()
  console.log(`  Event ID:   ${eventNote}`)
  console.log(`  Attestor:   ${attestorNpub}`)
  console.log(`  Image:      ${imageName}`)
  console.log(`  Digest:     ${imageDigest}`)
  console.log(`  Commit:     ${sourceCommit.slice(0, 7)}`)
  console.log(`  Relay:      ${relayUrl}`)
  console.log()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
