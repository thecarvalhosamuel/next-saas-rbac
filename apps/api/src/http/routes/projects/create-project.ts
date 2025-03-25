import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/utils/createSlug'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { UnautorizedError } from '../_errors/unauthorizedError'

const paramsSchema = z.object({
  slug: z.string(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

const projectSchema = z.object({
  name: z.string(),
  description: z.string(),
})
type ProjectSchema = z.infer<typeof projectSchema>

const response201Schema = z.object({
  projectId: z.string().uuid(),
})

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Create a project.',
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          body: projectSchema,
          response: {
            201: response201Schema,
          },
        },
      },
      async (
        request: FastifyRequest<{ Body: ProjectSchema; Params: ParamsSchema }>,
        reply: FastifyReply,
      ) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Project')) {
          throw new UnautorizedError(
            'You`re not allowed to create a new project.',
          )
        }

        const { description, name } = request.body

        const project = await prisma.project.create({
          data: {
            name,
            description,
            slug: slugify(name),
            organizationId: organization.id,
            ownerId: userId,
          },
        })

        return reply.status(201).send({
          projectId: project.id,
        })
      },
    )
}
