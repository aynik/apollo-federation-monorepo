import assert from 'assert'
import bcrypt from 'bcryptjs'
import { sign as jwtSign, verify as jwtVerify } from 'jsonwebtoken'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function hashPasswordSync(password: string) {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, withPassword: string) {
  return bcrypt.compare(password, withPassword)
}

export interface JwtContext {
  userId?: string
  refreshId?: string
}

export function signJwt(payload: JwtContext, expiresIn: string) {
  return jwtSign(payload, process.env.JWT_SECRET ?? '', {
    algorithm: 'HS256',
    expiresIn,
  })
}

export function verifyJwt(token: string) {
  return jwtVerify(token, process.env.JWT_SECRET ?? '')
}

export function decodeJwt(token: string) {
  const decoded = jwtVerify(token, process.env.JWT_SECRET ?? '')
  assert(typeof decoded === 'object' && 'userId' in decoded, 'Invalid JWT')
  return decoded as JwtContext
}

export function createJwtContext(header: string | undefined) {
  if (header) {
    const token = header.replace('Bearer ', '')
    return decodeJwt(token)
  }
  return {} as JwtContext
}
