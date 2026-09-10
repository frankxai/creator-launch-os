/** Only a browser-created blob from this page's origin may reach the player. */
export function localAudioSource(value: string, origin: string): string | undefined {
  try {
    const url = new URL(value)
    if (url.protocol === "blob:" && url.origin === origin && origin !== "null") {
      return url.href
    }
  } catch {
    // An invalid or foreign source leaves the player without a resource.
  }
  return undefined
}
