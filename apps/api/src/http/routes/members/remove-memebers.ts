import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { UnautorizedError } from '../_errors/unauthorizedError'

const paramsSchema = z.object({
  organizationSlug: z.string(),
  memeberId: z.string().uuid(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

export async function removeember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:organizationSlug/members/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Remove a member from organization.',
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
        const { organizationSlug, memeberId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('delete', 'User')) {
          throw new UnautorizedError(
            'You`re not allowed to delete this member.',
          )
        }

        await prisma.member.delete({
          where: {
            id: memeberId,
            organizationId: organization.id,
          },
        })

        return reply.status(204).send()
      },
    )
}
