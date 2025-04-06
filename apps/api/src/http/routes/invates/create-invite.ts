import { roleSchema } from '@saas/auth'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { BadRequestError } from '../_errors/bad-request'
import { UnautorizedError } from '../_errors/unauthorizedError'

const paramsSchema = z.object({
  organizationSlug: z.string(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

const inviteSchema = z.object({
  email: z.string().email(),
  role: roleSchema,
})
type InviteSchema = z.infer<typeof inviteSchema>

const response201Schema = z.object({
  inviteId: z.string().uuid(),
})

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:organizationSlug/invites',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Create a Invite for organization.',
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          body: inviteSchema,
          response: {
            201: response201Schema,
          },
        },
      },
      async (
        request: FastifyRequest<{ Body: InviteSchema; Params: ParamsSchema }>,
        reply: FastifyReply,
      ) => {
        const { organizationSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Invite')) {
          throw new UnautorizedError('You`re not allowed to create invites.')
        }

        const { email, role } = request.body

        const [, domain] = email.split('@')

        if (
          organization.shouldAttachUsersByDomain &&
          organization.domain === domain
        ) {
          throw new BadRequestError(
            `Users with "${domain}" domain will join your organization automatically on login.`,
          )
        }

        const inviteWithSameEmail = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: organization.id,
            },
          },
        })

        if (inviteWithSameEmail) {
          throw new BadRequestError(
            `Another invite with ame e-mail already exists.`,
          )
        }

        const memberWithSameEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: { email },
          },
        })

        if (memberWithSameEmail) {
          throw new BadRequestError(`A member with same e-mail already exists.`)
        }

        const invite = await prisma.invite.create({
          data: {
            email,
            role,
            authorId: userId,
            organizationId: organization.id,
          },
        })

        return reply.status(201).send({
          inviteId: invite.id,
        })
      },
    )
}
