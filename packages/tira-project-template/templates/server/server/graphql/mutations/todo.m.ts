import { createTypeComposer, createResolver, createResultMetaFields } from '@tira/tira-graphql';
import { TodoTC } from '../types/modelTypes';

const createTodo = createResolver({
  description: 'create a todo item',
  name: 'CoreTodoCreateTodo',
  args: {
    input: {
      description: 'information of the todo item',
      type: TodoTC.getInputTypeComposer()
        .clone('CoreTodoCreateTodoInput')
        .removeField(['id', 'createdAt', 'updatedAt']),
    },
  },
  outputFields: {
    ...TodoTC.getFields(),
    ...createResultMetaFields(),
  },
  resolve: (source: any, { input }: any, context: any, projection: any, info: any) => {
    // return new TodoSvc().createTodo(input);
  },
});

const updateTodo = createResolver({
  description: 'update the todo item',
  name: 'CoreTodoUpdateTodo',
  args: {
    id: {
      description: 'id of the todo item',
      type: 'String!',
    },
    input: {
      description: 'information of the todo item that to be updated',
      type: TodoTC.getInputTypeComposer()
        .clone('CoreTodoUpdateTodoInput')
        .removeField(['id', 'isPlatform', 'shopUserId', 'createdAt', 'updatedAt', 'Images', 'ShopUser'])
        .addFields({
          images: {
            description: 'an example of how to dynamic generate new graphql types',
            type: ['String'],
          },
        }),
    },
  },
  outputFields: {
    ...TodoTC.getFields(),
    ...createResultMetaFields(),
  },
  resolve: (source: any, { id, input }: any, context: any, projection: any, info: any) => {
    // return new TodoSvc().updateTodo(id, input);
  },
});

const removeTodos = createResolver({
  description: 'remove a todo item',
  name: 'CoreTodoRemoveTodos',
  args: {
    id: {
      description: 'array of the todo id that to be removed',
      type: ['String!'],
    },
  },
  outputTC: ['String!'],
  resolve: (source: any, { id }: any, context: any, projection: any, info: any) => {
    // return new TodoSvc().removeTodos(id);
  },
});

export const todoMutation = {
  todo: {
    description: 'todo related operation',
    type: createTypeComposer({
      description: 'todo related operation',
      name: 'CoreTodoMutation',
      fields: {
        createTodo,
        updateTodo,
        removeTodos,
      },
    }),
    resolve: () => {
      return {};
    },
  },
};
