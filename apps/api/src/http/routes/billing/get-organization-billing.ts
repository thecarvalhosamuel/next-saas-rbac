import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { UnautorizedError } from '../_errors/unauthorizedError'

const organizationParams = z.object({
  slug: z.string(),
})
type OrganizationParams = z.infer<typeof organizationParams>

const response200Schema = z.object({
  billing: z.object({
    seats: z.object({
      amount: z.number(),
      unit: z.number(),
      price: z.number(),
    }),
    projects: z.object({
      amount: z.number(),
      unit: z.number(),
      price: z.number(),
    }),
    total: z.number(),
  }),
})

export async function getOrganizationBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/billing',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get Organization Billing information',
          description: 'Get Organization Billing information',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: response200Schema,
          },
        },
      },
      async (
        request: FastifyRequest<{ Params: OrganizationParams }>,
        reply: FastifyReply,
      ) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Billing')) {
          throw new UnautorizedError(
            'You are not allowed to get organization billing information',
          )
        }

        const [amoutOfMembers, amountOfProjects] = await Promise.all([
          prisma.member.count({
            where: {
              organizationId: organization.id,
              role: { not: 'BILLING' },
            },
          }),
          prisma.project.count({
            where: {
              organizationId: organization.id,
            },
          }),
        ])

        return reply.status(200).send({
          billing: {
            seats: {
              amount: amoutOfMembers,
              unit: 10,
              price: amoutOfMembers * 10,
            },
            projects: {
              amount: amountOfProjects,
              unit: 20,
              price: amountOfProjects * 20,
            },
            total: amoutOfMembers * 10 + amountOfProjects * 20,
          },
        })
      },
    )
}
