import { organizationSchema as authOrganizationSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/getUserPermissions'

import { BadRequestError } from '../_errors/bad-request'
import { UnautorizedError } from '../_errors/unauthorizedError'

const organizationSchema = z.object({
  name: z.string(),
  domain: z.string().nullish(),
  shouldAttachUsersByDomain: z.boolean().optional(),
})
type OrganizationSchema = z.infer<typeof organizationSchema>

export async function updateOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch<{ Body: OrganizationSchema }>(
      '/organizations/:slug',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Update Organization',
          description: 'Upadate the Organization data ',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: organizationSchema,
          response: {
            204: z.null(),
          },
        },
      },
      async (
        request: FastifyRequest<{ Body: OrganizationSchema }>,
        reply: FastifyReply,
      ) => {
        const { slug } = request.params as { slug: string }

        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { name, domain, shouldAttachUsersByDomain } = request.body

        const authOrganization = authOrganizationSchema.parse(organization)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('update', authOrganization)) {
          throw new UnautorizedError(
            'You do not have permission to update this organization',
          )
        }

        if (domain) {
          const organizationByDomain = await prisma.organization.findFirst({
            where: { domain, slug: { not: slug } },
          })
          if (organizationByDomain) {
            throw new BadRequestError(
              'Another Organization with same domain already exists.',
            )
          }
        }

        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
          },
        })

        return reply.status(204).send()
      },
    )
}
