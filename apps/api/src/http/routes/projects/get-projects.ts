import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { UnautorizedError } from '../_errors/unauthorizedError'

const paramsSchema = z.object({
  slug: z.string(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

const response200Schema = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      slug: z.string(),
      avatarUrl: z.string().nullable(),
      organizationId: z.string().uuid(),
      ownerId: z.string().uuid(),
      owner: z.object({
        id: z.string().uuid(),
        name: z.string(),
        avatarUrl: z.string().nullable(),
      }),
    }),
  ),
})

export async function getProjects(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/projects/',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get all organization projects.',
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
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Project')) {
          throw new UnautorizedError(
            'You`re not allowed to see organization project.',
          )
        }

        const projects = await prisma.project.findMany({
          where: {
            organizationId: organization.id,
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(201).send({
          projects,
        })
      },
    )
}
