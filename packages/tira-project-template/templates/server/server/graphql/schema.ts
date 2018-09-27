import { GQC, createTypeComposer } from '@tira/tira-graphql';
import { todoMutation } from './mutations/todo.m';
import { todoQuery } from './queries/todo.q';

const buildQuery = () => {
  GQC.rootQuery().addFields({
    core: {
      description: 'the catalog of core system',
      type: createTypeComposer({
        description: 'the catalog of core system',
        name: 'CoreQuery',
        fields: {
          ...todoQuery,
        },
      }),
      resolve: () => {
        return {};
      },
    },
  });
};

const buildMutation = () => {
  GQC.rootMutation().addFields({
    core: {
      description: 'the catalog of core system',
      type: createTypeComposer({
        description: 'the catalog of core system',
        name: 'CoreMutation',
        fields: {
          ...todoMutation,
        },
      }),
      resolve: () => {
        return {};
      },
    },
  });
};

const buildSchema = () => {
  buildQuery();
  buildMutation();

  return GQC.buildSchema();
};

const graphqlSchema = buildSchema();

export default graphqlSchema;
