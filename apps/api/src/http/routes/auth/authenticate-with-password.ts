import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with email and password',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const userFromEmail = await prisma.user.findUnique({
        where: { email },
      })
      if (!userFromEmail) {
        return reply.status(401).send({ message: 'Invalid credentials' })
      }
      if (userFromEmail.passwordHash === null) {
        return reply
          .status(401)
          .send({ message: 'User does not have a password, use social login' })
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash,
      )
      if (!isPasswordValid) {
        return reply.status(401).send({ message: 'Invalid credentials' })
      }

      const token = app.jwt.sign(
        {
          sub: userFromEmail.id,
        },
        {
          expiresIn: '7d',
        },
      )

      return reply.status(201).send({ token })
    },
  )
}
