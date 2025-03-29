import { roleSchema } from '@saas/auth'
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

const bodySchema = z.object({
  role: roleSchema,
})
type BodySchema = z.infer<typeof bodySchema>

export async function updateMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:organizationSlug/members/:memberId',
      {
        schema: {
          tags: ['Members'],
          summary: 'Update member.',
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          response: {
            204: z.null(),
          },
        },
      },
      async (
        request: FastifyRequest<{ Params: ParamsSchema; Body: BodySchema }>,
        reply: FastifyReply,
      ) => {
        const { organizationSlug, memeberId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('update', 'User')) {
          throw new UnautorizedError(
            'You`re not allowed to update this members.',
          )
        }

        const { role } = request.body

        await prisma.member.update({
          where: {
            id: memeberId,
            organizationId: organization.id,
          },
          data: { role },
        })

        return reply.status(204).send()
      },
    )
}
