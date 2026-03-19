import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseAttestation, validateAttestation } from '../src/index.js'
import type { NostrEvent, Attestation } from '../src/types.js'

interface Vector {
  name: string
  description: string
  event: NostrEvent
  expected: Attestation
  valid: boolean
}

const vectors: Vector[] = JSON.parse(
  readFileSync(new URL('../vectors/attestations.json', import.meta.url), 'utf-8')
)

describe('test vectors', () => {
  for (const vector of vectors) {
    describe(vector.name, () => {
      it('parseAttestation returns expected result', () => {
        const result = parseAttestation(vector.event)
        expect(result).toEqual(vector.expected)
      })

      it(`validateAttestation returns valid=${vector.valid}`, () => {
        const result = validateAttestation(vector.event)
        expect(result.valid).toBe(vector.valid)
      })
    })
  }
})
