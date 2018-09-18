import * as fs from 'fs';
import { graphql, GraphQLSchema } from 'graphql';
import { introspectionQuery } from 'graphql/utilities';
import { introspectSchema, makeRemoteExecutableSchema } from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { ApolloLink } from 'apollo-link';
import { TypeComposer, Resolver } from 'graphql-compose';
import { ExecutionResult } from 'graphql/execution/execute';
import { GraphQLInputObjectType } from 'graphql';

export async function getRemoteSchema(uri: string): Promise<GraphQLSchema> {
  try {
    const customFetch = (uri: string, options: any): any => {
      return fetch(uri, options);
    };
    const middlewareLink = new ApolloLink((operation, forward) => {
      const context = operation.getContext();
      const req = context.graphqlContext;
      if (req && req.headers) {
        operation.setContext({ graphqlContext: context.graphqlContext, headers: { cookie: req.headers['cookie'] } });
      }
      if (!forward) {
        throw new Error();
      }
      return forward(operation).map((result) => {
        const context = operation.getContext();
        const response = context.response;
        const responseHeaders = response.headers._headers;

        if (req && responseHeaders) {
          const headers: any = {};
          const excludeHeaderNames = ['connection', 'content-encoding'];
          for (const headerName in responseHeaders) {
            if (
              responseHeaders[headerName] &&
              responseHeaders[headerName].length > 0 &&
              excludeHeaderNames.indexOf(headerName) === -1
            ) {
              headers[headerName] = responseHeaders[headerName][0];
            }
          }
          for (const headerName in headers) {
            req.res.header(headerName, headers[headerName]);
          }
        }

        return result;
      });
    });
    const httpLink = new HttpLink({ uri, fetch: customFetch });

    const link = middlewareLink.concat(<any>httpLink);

    const schema = await introspectSchema(<any>link);
    const remoteSchema = makeRemoteExecutableSchema({
      schema: <any>schema,
      link: <any>link,
    });
    return remoteSchema;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getJsonSchema(schema: GraphQLSchema): Promise<ExecutionResult> {
  const jsonSchema = await graphql(schema, introspectionQuery);
  return jsonSchema;
}

export async function generateJsonFileBySchema(schema: GraphQLSchema, generateDirectory: string): Promise<void> {
  const jsonSchema = await graphql(schema, introspectionQuery);
  if (!fs.existsSync(generateDirectory)) {
    fs.mkdirSync(generateDirectory);
  }
  const schemaPath = generateDirectory + '/schema.json';
  fs.writeFileSync(schemaPath, JSON.stringify(jsonSchema, null, 2));
}

export async function generateJsonFileByUrl(graphQLUrl: string, generateDirectory: string): Promise<void> {
  const schema = await getRemoteSchema(graphQLUrl);
  await generateJsonFileBySchema(schema, generateDirectory);
}

export function createResultMetaFields(codeDescription: string = '0.成功; 1.失败'): any {
  return {
    errCode: {
      description: codeDescription,
      type: 'Int',
      resolve: (parent: any) => parent.errCode || 0,
    },
    errText: {
      description: '错误描述',
      type: 'String',
      resolve: (parent: any) => parent.errText || '',
    },
  };
}

export function createTypeComposer(config: any): TypeComposer<any> {
  const tc = TypeComposer.create(config.name);
  tc.setDescription(config.description || '');
  tc.addFields(config.fields);
  return tc;
}

export function createInputTypeComposer(config: any): GraphQLInputObjectType {
  const tc = TypeComposer.create(config.name);
  tc.setDescription(config.description || '');
  tc.addFields(config.fields);
  return tc.getInputType();
}

export function createResolver(config: any): Resolver<any, any> {
  const resolverOptions = Object.assign({}, config);
  if (resolverOptions.inputFields) {
    resolverOptions.args = {
      input: {
        description: '输入参数',
        type: createInputTypeComposer({
          name: config.name,
          fields: resolverOptions.inputFields,
        }),
      },
    };
    delete resolverOptions.inputFields;
  }
  let outputTC = null;
  if (config.outputTC) {
    outputTC = config.outputTC;
  } else if (config.outputFields) {
    outputTC = TypeComposer.create(config.name + 'Payload');
    outputTC.addFields(config.outputFields);
  }
  resolverOptions.type = outputTC;
  const rawResolve = resolverOptions.resolve;
  resolverOptions.resolve = ({ source, args, context, projection, info }: any) => {
    context.user = context.req.user;
    if (context.user) {
      context.user.id = context.user.userId;
      context.userId = context.user.id;
    }
    return rawResolve(source, args, context, projection, info);
  };
  delete resolverOptions.outputFields;
  delete resolverOptions.outputTC;
  return new Resolver(resolverOptions);
}
