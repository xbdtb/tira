import { createTypeComposer, createResolver, createCollectionTCResolver } from '@tira/tira-graphql';
import { TodoTC } from '../types/modelTypes';

const getTodo = createResolver({
  description: 'get the detail of todo item',
  name: 'CoreGiftGetGift',
  args: {
    id: {
      description: 'todo id',
      type: 'String!',
    },
  },
  outputTC: TodoTC,
  resolve: (source: any, { id }: any, context: any, projection: any, info: any) => {
    return {};
  },
});

const todos = createCollectionTCResolver(TodoTC, 'CoreTodoShopTodos', {
  description: 'get all todos',
  filterFields: {
    content: {
      description: 'content of to item',
      type: 'String',
    },
  },
  sortFields: ['createdAt'],
  getManyResolveFn: (
    source: any,
    { filter, sort, page }: any,
    context: any,
    projection: any,
    info: any,
    fields: any,
  ) => {
    return {};
  },
});

export const todoQuery = {
  todo: {
    description: 'todo related queries',
    type: createTypeComposer({
      description: 'todo related queries',
      name: 'CoreTodoQuery',
      fields: {
        getTodo,
        todos,
      },
    }),
    resolve: () => {
      return {};
    },
  },
};
