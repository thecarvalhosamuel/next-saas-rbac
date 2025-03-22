import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'

const organizationParams = z.object({
  slug: z.string(),
})
type OrganizationParams = z.infer<typeof organizationParams>

const response200Schema = z.object({
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    domain: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    shouldAttachUsersByDomain: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    ownerId: z.string().uuid(),
  }),
})

export async function getOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get details from Organization',
          description: 'Get Organization',
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
        const { organization } = await request.getUserMembership(slug)
        return reply.status(200).send({ organization })
      },
    )
}
