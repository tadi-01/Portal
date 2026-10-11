import type { Router } from 'vue-router'

/** Only return to a known portal route; never trust a login query as a URL. */
export function safeReturnPath(router: Router, value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  if (
    [...value].some(
      (character) =>
        character === '\\' || character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return '/'
  }

  const resolved = router.resolve(value)
  if (
    !resolved.matched.length ||
    resolved.path === '/login' ||
    resolved.meta.staff ||
    resolved.name === 'not-found'
  ) {
    return '/'
  }
  return resolved.fullPath
}
