import { roleSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { BadRequestError } from '../_errors/bad-request'
import { UnautorizedError } from '../_errors/unauthorizedError'

const inviteParams = z.object({
  organizationSlug: z.string(),
})
type InviteParams = z.infer<typeof inviteParams>

const response200Schema = z.object({
  invites: z.array(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      role: roleSchema,
      createdAt: z.date(),
      author: z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().url().nullable(),
      }),
    }),
  ),
})

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:organizationSlug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get all organization invites.',
          description: 'Get all organization invites.',
          security: [{ bearerAuth: [] }],
          params: inviteParams,
          response: {
            200: response200Schema,
          },
        },
      },
      async (
        request: FastifyRequest<{ Params: InviteParams }>,
        reply: FastifyReply,
      ) => {
        const { organizationSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Invite')) {
          throw new UnautorizedError(
            'You`re not allowed to get organonization invites.',
          )
        }

        const invites = await prisma.invite.findMany({
          where: { organizationId: organization.id },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (!invites) {
          throw new BadRequestError('Invite not found.')
        }

        return reply.status(200).send({ invites })
      },
    )
}
