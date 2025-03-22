import { roleSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

const response200Schema = z.object({
  organizations: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      domain: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      role: roleSchema,
    }),
  ),
})

export async function getOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get Organizations where user is member',
          description: 'Get Organization',
          security: [{ bearerAuth: [] }],
          response: {
            200: response200Schema,
          },
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = await request.getCurrentUserId()
        const organizations = await prisma.organization.findMany({
          where: { members: { some: { userId } } },
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
            avatarUrl: true,
            members: {
              select: { role: true },
              where: { userId },
            },
          },
        })

        const organizationsWithRole = organizations.map(
          ({ members, ...org }) => {
            return {
              ...org,
              role: members[0]?.role,
            }
          },
        )

        return reply.status(200).send({
          organizations: organizationsWithRole,
        })
      },
    )
}
