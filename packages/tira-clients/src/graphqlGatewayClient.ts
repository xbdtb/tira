import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'node-fetch';

const customFetch = (uri: string, options: any): any => {
  return fetch(uri, options);
};

export function createGraphQLGatewayClient(uri: string): ApolloClient<any> {
  const client = new ApolloClient<any>({
    link: new HttpLink({ uri, fetch: customFetch }),
    cache: new InMemoryCache(),
  });
  return client;
}
