import yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { join as pathJoin } from 'path'
import { ApolloServer } from 'apollo-server'
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway'

const supergraphSdl = readFileSync(
  pathJoin(__dirname, '../supergraph.graphql'),
).toString()

const { subgraphs } = yaml.load(
  readFileSync(pathJoin(__dirname, '../supergraph.yaml')).toString(),
) as {
  subgraphs: {
    [name: string]: {
      routing_url: string
    }
  }
}

export const serviceList = Object.keys(subgraphs).map((name) => ({
  name,
  url: subgraphs[name].routing_url,
}))

if (require.main === module) {
  new ApolloServer({
    debug: process.env.NODE_ENV !== 'production',
    context({ req: { headers } }) {
      return { headers }
    },
    gateway: new ApolloGateway({
      buildService({ url }) {
        return new RemoteGraphQLDataSource({
          url,
          willSendRequest({ request, context }) {
            if ('headers' in context) {
              for (const header in context.headers) {
                request.http?.headers.set(header, context.headers[header])
              }
            }
          },
        })
      },
      ...(process.env.NODE_ENV === 'production'
        ? { supergraphSdl }
        : {
            experimental_pollInterval: 3000,
            serviceList,
          }),
    }),
  })
    .listen(process.env.PORT || 4000)
    .then(({ url }: { url: string }) => {
      console.log(`Graph gateway ready at ${url}`)
    })
    .catch((err: Error) => {
      console.error(err)
    })
}
