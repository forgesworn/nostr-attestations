/** Find the first tag with the given name. Internal helper — not part of the public API. */
export function findTag(tags: string[][], name: string): string | null {
  const tag = tags.find(t => t[0] === name)
  return tag?.[1] ?? null
}

/** Validate that a string is a 64-character lowercase hex string (32-byte key or event ID). */
export function isHex64(value: string): boolean {
  return value.length === 64 && /^[0-9a-f]{64}$/.test(value)
}
