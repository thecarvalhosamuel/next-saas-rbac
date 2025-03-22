import type { Role } from '@prisma/client'
import { defineAbilityFor, userSchema } from '@saas/auth'

export function getUserPermissions(userId: string, role: Role) {
  const userAuth = userSchema.parse({
    id: userId,
    role,
  })

  const ability = defineAbilityFor(userAuth)

  return ability
}
