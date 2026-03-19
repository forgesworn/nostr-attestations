/** Find the first tag with the given name. Internal helper — not part of the public API. */
export function findTag(tags: string[][], name: string): string | null {
  const tag = tags.find(t => t[0] === name)
  return tag?.[1] ?? null
}
