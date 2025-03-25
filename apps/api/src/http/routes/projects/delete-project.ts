import { projectSchema } from '@saas/auth'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { BadRequestError } from '../_errors/bad-request'
import { UnautorizedError } from '../_errors/unauthorizedError'

const paramsSchema = z.object({
  slug: z.string(),
  projectId: z.string().uuid(),
})
type ParamsSchema = z.infer<typeof paramsSchema>

export async function deleteProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/projects/:projectId',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Delete a project.',
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
        const { slug, projectId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
            organizationId: organization.id,
          },
        })

        if (!project) {
          throw new BadRequestError('Project not found')
        }

        const { cannot } = getUserPermissions(userId, membership.role)
        const authProject = projectSchema.parse(project)

        if (cannot('delete', authProject)) {
          throw new UnautorizedError(
            `You're not allowed to delete this project.`,
          )
        }

        await prisma.project.delete({
          where: { id: projectId },
        })

        return reply.status(204).send()
      },
    )
}
