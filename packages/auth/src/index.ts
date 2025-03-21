import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'
import { z } from 'zod'

import { User } from './models/user'
import { permissions } from './permissions'
import { billingSubjectSchema } from './subjects/billingSubject'
import { inviteSubjectSchema } from './subjects/inviteSubject'
import { organizationSubjectSchema } from './subjects/organizationSubject'
import { projectSubjectSchema } from './subjects/projectSubject'
import { userSubjectSchema } from './subjects/userSubject'

export * from './models/user'
export * from './models/organization'
export * from './models/project'
export * from './roles'

const appAbilitiesSchema = z.union([
  userSubjectSchema,
  projectSubjectSchema,
  organizationSubjectSchema,
  inviteSubjectSchema,
  billingSubjectSchema,
  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder<AppAbility>(createAppAbility)
  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permissions for role ${user.role} not found.`)
  }

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}
