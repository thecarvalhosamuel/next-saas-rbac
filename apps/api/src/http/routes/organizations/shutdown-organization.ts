import { organizationSchema as authOrganizationSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { UnautorizedError } from '../_errors/unauthorizedError'

export async function shutdownOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Shutdown Organization',
          description: 'Shutdow the Organization ',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { slug } = request.params as { slug: string }

        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const authOrganization = authOrganizationSchema.parse(organization)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('delete', authOrganization)) {
          throw new UnautorizedError(
            'You do not have permission to shutdown this organization',
          )
        }

        await prisma.organization.delete({
          where: { id: organization.id },
        })

        return reply.status(204).send()
      },
    )
}
