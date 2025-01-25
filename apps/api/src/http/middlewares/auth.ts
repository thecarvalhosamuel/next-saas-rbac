import type { FastifyInstance, FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { UnautorizedError } from '../routes/_errors/unauthorizedError'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()
        return sub
      } catch (error) {
        throw new UnautorizedError('Invalid auth token')
      }
    }
    await request.jwtVerify()
  })
})
