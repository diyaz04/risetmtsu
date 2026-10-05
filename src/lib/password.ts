import "server-only"
import { randomInt } from "node:crypto"
import bcrypt from "bcryptjs"

// tanpa karakter yang mudah tertukar (0/O, 1/l/I)
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function generatePassword(length = 8) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}
