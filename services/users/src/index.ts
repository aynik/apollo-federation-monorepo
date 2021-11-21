import gql from 'graphql-tag'
import { readFileSync } from 'fs'
import { join as pathJoin } from 'path'
import { createModelsContext } from '@shared/models'
import { createJwtContext } from '@shared/crypto'
import { ApolloServer } from 'apollo-server'
import { applyMiddleware } from 'graphql-middleware'
import { buildSubgraphSchema } from '@apollo/federation'
import { resolvers, permissions } from './resolvers'

const typeDefs = gql(
  readFileSync(pathJoin(__dirname, '../schema.graphql')).toString(),
)

const schema = applyMiddleware(
  buildSubgraphSchema({
    typeDefs,
    resolvers,
  }),
  permissions,
)

export { resolvers, typeDefs, schema }

if (require.main === module) {
  new ApolloServer({
    schema,
    context: ({
      req: {
        headers: { authorization },
      },
    }) => createModelsContext(createJwtContext(authorization)),
  })
    .listen({ port: process.env.PORT || 4000 })
    .then(({ url }: { url: string }) => {
      console.log(`Users service ready at ${url}`)
    })
    .catch((err: Error) => {
      console.error(err)
    })
}
