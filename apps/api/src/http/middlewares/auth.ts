import type { FastifyInstance, FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { prisma } from '@/lib/prisma'

import { UnautorizedError } from '../routes/_errors/unauthorizedError'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()
        return sub
      } catch (error) {
        throw new UnautorizedError('Invalid auth token.')
      }
    }

    request.getUserMembership = async (slug: string) => {
      const userId = await request.getCurrentUserId()
      const member = await prisma.member.findFirst({
        where: { userId, organization: { slug } },
        include: { organization: true },
      })
      if (!member) {
        throw new UnautorizedError('You are not a member of this organization.')
      }

      const { organization, ...membership } = member
      return { organization, membership }
    }
  })
})
