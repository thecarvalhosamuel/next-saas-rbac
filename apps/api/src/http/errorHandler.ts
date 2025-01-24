import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import { BadRequestError } from './routes/_errors/bad-request'
import { UnautorizedError } from './routes/_errors/unauthorizedError'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
  }
  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }
  if (error instanceof UnautorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  console.error(error)
  // send error to some obervability platform
  return reply.status(500).send({ message: 'Internal server error' })
}
