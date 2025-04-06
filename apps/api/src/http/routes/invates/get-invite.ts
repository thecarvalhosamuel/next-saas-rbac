import { roleSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request'

const inviteParams = z.object({
  id: z.string().uuid(),
})
type InviteParams = z.infer<typeof inviteParams>

const response200Schema = z.object({
  invite: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: roleSchema,
    createdAt: z.date(),
    author: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      avatarUrl: z.string().url().nullable(),
    }),
    organization: z.object({
      name: z.string(),
    }),
  }),
})

export async function getInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/invites/:id',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Get details from invite.',
        description: 'Get Invite',
        params: inviteParams,
        response: {
          200: response200Schema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: InviteParams }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params

      const invite = await prisma.invite.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!invite) {
        throw new BadRequestError('Invite not found.')
      }

      return reply.status(200).send({ invite })
    },
  )
}
