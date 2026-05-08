import "server-only"
import { randomBytes } from "node:crypto"

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

/** Cryptographically random base62 slug. Default 7 chars (~3.5T combos). */
export function generateSlug(length = 7): string {
  const bytes = randomBytes(length * 2)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return out
}

/** 32-byte url-safe owner token. Returned once, used for edit/delete auth. */
export function generateOwnerKey(): string {
  return randomBytes(24).toString("base64url")
}
