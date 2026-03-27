/// <reference types="node" />

import { SimplePool } from 'nostr-tools/pool'
import * as nip19 from 'nostr-tools/nip19'
import { parseAttestation, isValid, TYPES, ATTESTATION_KIND } from 'nostr-attestations'
import type { NostrEvent } from 'nostr-attestations'

// --- env var resolution ---

const RELAY_URL = process.env.RELAY_URL ?? 'wss://relay.damus.io'
const PUBKEY_INPUT = process.env.PUBKEY
const IMAGE_NAME = process.env.IMAGE_NAME

if (!PUBKEY_INPUT) {
  console.error('Error: PUBKEY env var is required (hex pubkey or npub1...)')
  process.exit(1)
}

if (!IMAGE_NAME) {
  console.error('Error: IMAGE_NAME env var is required (e.g. toll-booth/routing-proxy)')
  process.exit(1)
}

// --- pubkey resolution ---

function resolvePubkey(input: string): string {
  if (input.startsWith('npub1')) {
    const { data } = nip19.decode(input)
    return data as string
  }
  if (/^[0-9a-f]{64}$/.test(input)) {
    return input
  }
  throw new Error('PUBKEY must be a 64-char hex pubkey or npub1... bech32 string')
}

let hexPubkey: string
try {
  hexPubkey = resolvePubkey(PUBKEY_INPUT)
} catch (err) {
  console.error(`Error: ${(err as Error).message}`)
  process.exit(1)
}

// --- fetch & display ---

async function main() {
  const pool = new SimplePool()

  // Query by kind + author only. Most relays don't index custom tags like #type,
  // so we filter by type and image name client-side after fetching.
  const filter = { kinds: [ATTESTATION_KIND], authors: [hexPubkey] }

  let events: NostrEvent[]
  try {
    events = await pool.querySync([RELAY_URL], filter) as unknown as NostrEvent[]
  } catch (err) {
    console.error(`Error fetching from relay: ${(err as Error).message}`)
    process.exit(1)
  } finally {
    pool.close([RELAY_URL])
  }

  // Parse and filter by type + image name client-side
  const matches = events
    .map((event: NostrEvent) => ({ event, parsed: parseAttestation(event) }))
    .filter(({ parsed }) => parsed !== null && parsed.type === TYPES.PROVENANCE && parsed.identifier === IMAGE_NAME)

  if (matches.length === 0) {
    console.log(`No build attestations found for "${IMAGE_NAME}" from ${nip19.npubEncode(hexPubkey)}`)
    return
  }

  // Sort newest first
  matches.sort((a, b) => b.event.created_at - a.event.created_at)

  for (const { event, parsed } of matches) {
    if (!parsed) continue

    const validity = isValid(event)

    // Parse content JSON for build details
    let buildDetails: Record<string, string> = {}
    try {
      buildDetails = parsed.content ? JSON.parse(parsed.content) : {}
    } catch {
      // Non-JSON content
    }

    const attestedAt = new Date(event.created_at * 1000).toISOString()

    console.log(`\nBuild Attestation: ${parsed.identifier}`)
    console.log(`  Attestor:    ${nip19.npubEncode(parsed.pubkey)}`)
    console.log(`  Status:      ${validity.valid ? 'valid' : `invalid (${validity.reason})`}`)

    if (buildDetails.image) {
      console.log(`  Image:       ${buildDetails.image}`)
    }
    if (buildDetails.source) {
      console.log(`  Source:      ${buildDetails.source}`)
    }
    if (buildDetails.commit) {
      console.log(`  Commit:      ${buildDetails.commit}`)
    }
    if (buildDetails.built) {
      console.log(`  Built:       ${buildDetails.built}`)
    }
    console.log(`  Attested:    ${attestedAt}`)
    console.log(`  Event ID:    ${nip19.noteEncode(event.id)}`)
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`)
  process.exit(1)
})
