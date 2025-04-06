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
  inviteId: z.string().uuid(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

export async function revokeInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:organizationSlug/invites/:inviteId',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Revoke an invite.',
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          response: {
            204: z.null(),
          },
        },
      },
      async (
        request: FastifyRequest<{ Params: ParamsSchema }>,
        reply: FastifyReply,
      ) => {
        const { organizationSlug, inviteId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('delete', 'Invite')) {
          throw new UnautorizedError('You`re not allowed to delete an invites.')
        }

        const invite = await prisma.invite.findUnique({
          where: { id: inviteId, organizationId: organization.id },
        })

        if (!invite) {
          throw new BadRequestError(`Invite not found.`)
        }

        await prisma.invite.delete({
          where: { id: inviteId, organizationId: organization.id },
        })

        return reply.status(204).send(null)
      },
    )
}
