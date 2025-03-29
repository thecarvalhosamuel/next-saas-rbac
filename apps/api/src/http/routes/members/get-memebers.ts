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
})
type ParamsSchema = z.infer<typeof paramsSchema>

const response200Schema = z.object({
  members: z.object({
    id: z.string(),
    role: roleSchema,
    user: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      avatarUrl: z.string().nullable(),
      createdAt: z.date(),
    }),
  }),
})

export async function getMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:organizationSlug/members',
      {
        schema: {
          tags: ['Members'],
          summary: 'Get all organization members.',
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          response: {
            200: response200Schema,
          },
        },
      },
      async (
        request: FastifyRequest<{ Params: ParamsSchema }>,
        reply: FastifyReply,
      ) => {
        const { organizationSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'User')) {
          throw new UnautorizedError(
            'You`re not allowed to see this organization members.',
          )
        }

        const members = await prisma.member.findMany({
          where: {
            organizationId: organization.id,
          },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            role: 'asc',
          },
        })

        const membersWithRoles = members.map(
          ({ user: { id: userId, ...user }, ...member }) => {
            return {
              ...member,
              ...user,
              userId,
            }
          },
        )

        return reply.status(201).send({
          members: membersWithRoles,
        })
      },
    )
}
