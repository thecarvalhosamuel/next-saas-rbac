import { roleSchema } from '@saas/auth'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request'

const response200Schema = z.object({
  invites: z.array(
    z.object({
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
  ),
})

export async function getPendingInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/invites/pending',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get all pending invites.',
          description: 'Get all pending invites.',
          response: {
            200: response200Schema,
          },
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        const invites = await prisma.invite.findMany({
          where: { email: user.email },
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

        return reply.status(200).send({ invites })
      },
    )
}
