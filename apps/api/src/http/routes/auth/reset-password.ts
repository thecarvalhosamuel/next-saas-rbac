import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { UnautorizedError } from '../_errors/unauthorizedError'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/reset',
    {
      schema: {
        tags: ['auth'],
        summary: 'Get authenticate user profile',
        body: z.object({
          code: z.string().uuid(),
          password: z.string().min(6),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, password } = request.body

      const tokenFromCode = await prisma.token.findUnique({
        where: { id: code },
      })

      if (!tokenFromCode) {
        throw new UnautorizedError()
      }

      const passwordHash = await hash(password, 6)

      await prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id: tokenFromCode.userId },
          data: { passwordHash },
        })

        await prisma.token.delete({
          where: { id: code },
        })
      })

      return reply.status(204).send()
    },
  )
}
