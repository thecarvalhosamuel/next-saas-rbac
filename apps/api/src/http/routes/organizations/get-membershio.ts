import { roleSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'

const paramsSchema = z.object({ slug: z.string() })
type ParamsSchema = z.infer<typeof paramsSchema>

const response200Schema = z.object({
  membership: z.object({
    id: z.string().uuid(),
    role: roleSchema,
    organizationId: z.string().uuid(),
  }),
})

export async function getMembership(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get<{ Params: ParamsSchema }>(
      '/organizations/:slug/membership',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get user membership on organization',
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
        const { membership } = await request.getUserMembership(slug)

        return reply.status(200).send({
          membership: {
            id: membership.id,
            role: membership.role,
            organizationId: membership.organizationId,
          },
        })
      },
    )
}
