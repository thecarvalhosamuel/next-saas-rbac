import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/utils/createSlug'

import { BadRequestError } from '../_errors/bad-request'

const organizationSchema = z.object({
  name: z.string(),
  domain: z.string().nullish(),
  shouldAttachUsersByDomain: z.boolean().optional(),
})
type OrganizationSchema = z.infer<typeof organizationSchema>

const response201Schema = z.object({
  organizationId: z.string().uuid(),
})

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post<{ Body: OrganizationSchema }>(
      '/organization',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Create a new Organization',
          description: 'Create and manage the Organization work ',
          security: [{ bearerAuth: [] }],
          body: organizationSchema,
          response: {
            201: response201Schema,
          },
        },
      },
      async (
        request: FastifyRequest<{ Body: OrganizationSchema }>,
        reply: FastifyReply,
      ) => {
        const userId = await request.getCurrentUserId()
        const { name, domain, shouldAttachUsersByDomain } = request.body

        if (domain) {
          const organizationByDomain = await prisma.organization.findUnique({
            where: { domain },
          })
          if (organizationByDomain) {
            throw new BadRequestError(
              'Another Organization with same domain already exists.',
            )
          }
        }

        const organization = await prisma.organization.create({
          data: {
            name,
            slug: slugify(name),
            domain,
            shouldAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        return reply.status(201).send({
          organizationId: organization.id,
        })
      },
    )
}
