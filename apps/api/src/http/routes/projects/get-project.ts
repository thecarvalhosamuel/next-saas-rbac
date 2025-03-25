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
  projectSlug: z.string(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

const response200Schema = z.object({
  project: z.object({
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
})

export async function getProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:organizationSlug/projects/:projectSlug',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Get a project details.',
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
        const { organizationSlug, projectSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(organizationSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Project')) {
          throw new UnautorizedError('You`re not allowed to see this project.')
        }

        const project = await prisma.project.findUnique({
          where: {
            slug: projectSlug,
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
        })

        if (!project) {
          throw new BadRequestError('Project not found.')
        }

        return reply.status(201).send({
          project,
        })
      },
    )
}
