import { faker } from '@faker-js/faker/locale/pt_BR'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await hash('123456', 1)

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'johndoe@acme.com',
      passwordHash,
      avatarUrl: faker.image.avatarGitHub(),
    },
  })

  const another = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash,
      avatarUrl: faker.image.avatarGitHub(),
    },
  })

  const third = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash,
      avatarUrl: faker.image.avatarGitHub(),
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Acme Inc. (Admin)',
      domain: 'acme.com',
      slug: 'acme-admin',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: user.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: 'ADMIN',
            },
            {
              userId: another.id,
              role: 'MEMBER',
            },
            {
              userId: third.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Acme Inc. (Member)',
      slug: 'acme-member',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: user.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: 'MEMBER',
            },
            {
              userId: another.id,
              role: 'ADMIN',
            },
            {
              userId: third.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Acme Inc. (Billing)',
      slug: 'acme-billing',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: user.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.slug(),
              description: faker.lorem.paragraph(2),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: faker.helpers.arrayElement([
                user.id,
                another.id,
                third.id,
              ]),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: 'BILLING',
            },
            {
              userId: another.id,
              role: 'ADMIN',
            },
            {
              userId: third.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  })
}

seed().then(() => {
  console.log('Seed completed')
})
