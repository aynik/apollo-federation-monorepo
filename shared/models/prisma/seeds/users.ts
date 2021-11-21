import { hashPasswordSync } from '@shared/crypto'

export default [
  {
    name: 'User',
    email: 'user@example.com',
    password: hashPasswordSync('password'),
  },
]
