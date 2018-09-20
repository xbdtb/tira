import * as express from 'express';
import { playground, TypeComposer } from '@tira/tira-graphql';
import { ApolloServer, gql } from 'apollo-server-express';
import { getRemoteSchema } from '@tira/tira-graphql';
import { mergeSchemas } from 'graphql-tools';
import { GraphQLSchema } from 'graphql';

export type GatewayEndpoint = {
  subPath: string;
  targets: string[];
  queryFilter?: FilterMap;
  mutationFilter?: FilterMap;
};

export type FilterMap = {
  $include?: string[];
  $exclude?: string[];
  [name: string]: FilterMap | string[] | undefined;
};

async function mergeRemoteSchemas(targets: string[], log: boolean): Promise<GraphQLSchema> {
  const remoteSchemas = [];
  try {
    for (let i = 0; i < targets.length; i++) {
      const remoteSchema = await getRemoteSchema(targets[i]);
      remoteSchemas.push(remoteSchema);
    }
  } catch (err) {
    console.log(err);
    throw err;
  }

  const schema = mergeSchemas({ schemas: remoteSchemas });

  return schema;
}

function applyTCFilter(tc: TypeComposer, filterMap: FilterMap) {
  if (filterMap.$include) {
    tc.removeOtherFields(filterMap.$include as string[]);
  } else if (filterMap.$exclude) {
    tc.removeField(filterMap.$exclude as string[]);
  }
  for (const fieldName in filterMap) {
    if (fieldName !== '$include' && fieldName !== '$exclude') {
      const tcField = tc.get(fieldName);
      if (tcField) {
        applyTCFilter(tcField, filterMap[fieldName] as FilterMap);
      }
    }
  }
}

const typeDefs = gql`
  type Query {
    notInitialized: Boolean
  }
`;

export class GraphQLGatewayProxy {
  private apolloServers: { [index: number]: ApolloServer } = {};
  private app?: express.Application;

  constructor(
    private endpoints: GatewayEndpoint[],
    private resourceFilePath: string = 'public/playground',
    private updateInterval: number = 10000,
  ) {}

  applyMiddleware(app: express.Application) {
    this.app = app;
    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.endpoints[i];

      this.app.get(
        [endpoint.subPath, endpoint.subPath + '/js/*', endpoint.subPath + '/css/*'],
        playground({ resourceFilePath: this.resourceFilePath, templateParams: { endpoint: endpoint.subPath } }),
      );

      const apolloServer = new ApolloServer({
        typeDefs,
        subscriptions: false,
        tracing: true,
        engine: false,
        introspection: true,
        playground: {
          settings: {
            'general.betaUpdates': false,
            'editor.cursorShape': 'line',
            'editor.fontSize': 14,
            'editor.fontFamily': `'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`,
            'editor.theme': 'light',
            'editor.reuseHeaders': true,
            'prettier.printWidth': 80,
            'request.credentials': 'include',
            'tracing.hideTracingResponse': true,
          },
        },
        context: (req: any) => req,
      });
      apolloServer.applyMiddleware({ app: this.app, path: endpoint.subPath });
      this.apolloServers[i] = apolloServer;
    }
    this.updateSchemas();
  }

  updateSchemas = async () => {
    try {
      if (!this.app) {
        return;
      }

      for (let i = 0; i < this.endpoints.length; i++) {
        const endpoint = this.endpoints[i];

        const schema = await mergeRemoteSchemas(endpoint.targets, true);
        if (endpoint.queryFilter) {
          applyTCFilter(new TypeComposer(<any>schema.getQueryType()), endpoint.queryFilter);
        }
        if (endpoint.mutationFilter) {
          applyTCFilter(new TypeComposer(<any>schema.getMutationType()), endpoint.mutationFilter);
        }

        const apolloServer = this.apolloServers[i];
        apolloServer['schema'] = schema;
      }
      setTimeout(this.updateSchemas, this.updateInterval);
    } catch (err) {
      console.log(err);
    }
  };
}
