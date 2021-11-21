import { ApolloServer } from 'apollo-server'
import { ApolloGateway, LocalGraphQLDataSource } from '@apollo/gateway'
import { buildSubgraphSchema } from '@apollo/federation'
import { ModelsContext } from '@shared/models'
import { JwtContext } from '@shared/crypto'
import { serviceList } from '@services/gateway'
import { mockDeep, mockReset } from 'jest-mock-extended'
import { typeDefs as productsTypeDefs } from '@services/products'
import { schema as usersSchema } from '.'

jest.mock('@shared/crypto', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashedPassword')),
}))

const mockContext = mockDeep<ModelsContext & JwtContext>()

const mockedDataSources = {
  products: new LocalGraphQLDataSource(
    buildSubgraphSchema({
      typeDefs: productsTypeDefs,
      resolvers: {
        Query: {
          product: () => ({ id: '1' }),
        },
      },
    }),
  ),
}

function buildService({ name }: { name: string }) {
  return name in mockedDataSources
    ? mockedDataSources[name as keyof typeof mockedDataSources]
    : new LocalGraphQLDataSource(usersSchema)
}

const server = new ApolloServer({
  context: mockContext,
  gateway: new ApolloGateway({
    serviceList,
    buildService,
  }),
})

afterEach(() => {
  mockReset(mockContext)
})

describe('queries', () => {
  test('me', async () => {
    mockContext.userId = '1'
    mockContext.prisma.user.findUnique.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'foobar',
    })
    const { errors, data } = await server.executeOperation({
      query: `
        query {
          me {
            id
            email
            name
          }
        }
        `,
    })
    expect(mockContext.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    })
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      me: {
        id: '1',
        email: 'john@example.com',
        name: 'John Doe',
      },
    })
  })

  test('product.createdBy', async () => {
    mockContext.userId = '1'
    mockContext.prisma.user.findFirst.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'foobar',
    })
    const { errors, data } = await server.executeOperation({
      query: `
        query {
          product(id: "1") {
            id
            createdBy {
              id
              email
              name
            }
          }
        }
        `,
    })
    expect(mockContext.prisma.user.findFirst).toHaveBeenCalledWith({
      where: { products: { some: { id: '1' } } },
    })
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      product: {
        id: '1',
        createdBy: {
          id: '1',
          email: 'john@example.com',
          name: 'John Doe',
        },
      },
    })
  })
})

describe('mutations', () => {
  test('createUser', async () => {
    mockContext.prisma.user.create.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'foobar',
    })
    const { errors, data } = await server.executeOperation({
      query: `
        mutation ($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            email
            name
          }
        }
        `,
      variables: {
        input: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'foobar',
        },
      },
    })
    expect(mockContext.prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
      },
    })
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      createUser: {
        id: '1',
        email: 'john@example.com',
        name: 'John Doe',
      },
    })
  })
})
