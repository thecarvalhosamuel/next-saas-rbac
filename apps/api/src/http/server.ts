import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { env } from '@saas/env'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandler } from './errorHandler'
import { authenticateWithGithub } from './routes/auth/authenticate-with-github'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { createAccount } from './routes/auth/create-account'
import { getProfile } from './routes/auth/get-profile'
import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { resetPassword } from './routes/auth/reset-password'
import { getOrganizationBilling } from './routes/billing/get-organization-billing'
import { acceptInvite } from './routes/invates/accept-invite'
import { createInvite } from './routes/invates/create-invite'
import { getInvite } from './routes/invates/get-invite'
import { getInvites } from './routes/invates/get-invites'
import { getPendingInvites } from './routes/invates/get-pending-invites'
import { rejectInvite } from './routes/invates/reject-invite'
import { revokeInvite } from './routes/invates/revoke-invite'
import { getMembers } from './routes/members/get-memebers'
import { removeMember } from './routes/members/remove-memebers'
import { updateMember } from './routes/members/update-memebers'
import { createOrganization } from './routes/organizations/create-organization'
import { getMembership } from './routes/organizations/get-membershio'
import { getOrganization } from './routes/organizations/get-organization'
import { getOrganizations } from './routes/organizations/get-organizations'
import { shutdownOrganization } from './routes/organizations/shutdown-organization'
import { transferOrganization } from './routes/organizations/transfer-organization'
import { updateOrganization } from './routes/organizations/update-organization'
import { createProject } from './routes/projects/create-project'
import { deleteProject } from './routes/projects/delete-project'
import { getProject } from './routes/projects/get-project'
import { getProjects } from './routes/projects/get-projects'
import { updateProject } from './routes/projects/update-project'

const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Next Saas RBAC',
      description: 'Next Saas RBAC API with multi-tenant',
      contact: {
        name: 'Samuel',
        email: 'carvalho.asamuel@gmail.com',
        url: 'https://github.com/carvalhoasamuel/next-saas-rbac',
      },
      version: '1.0.0',
    },
    // securityDefinitions: {
    //   Authorization: {
    //     type: 'apiKey',
    //     in: 'header',
    //     name: 'Authorization',
    //     description: 'JWT obtained from authentication route.',
    //   },
    // },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(fastifyCors)
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)
app.register(authenticateWithGithub)

// organizations
app.register(createOrganization)
app.register(getMembership)
app.register(getOrganization)
app.register(getOrganizations)
app.register(updateOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)

// projects
app.register(createProject)
app.register(deleteProject)
app.register(getProject)
app.register(getProjects)
app.register(updateProject)

// members
app.register(getMembers)
app.register(updateMember)
app.register(removeMember)

// invites
app.register(createInvite)
app.register(getInvite)
app.register(getInvites)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(revokeInvite)
app.register(getPendingInvites)

// billing
app.register(getOrganizationBilling)

app
  .listen({ port: env.SERVER_PORT })
  .then(() => console.log('HTTP Server Running'))
