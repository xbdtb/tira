import { GraphQLEnumType, GraphQLNonNull, GraphQLString } from 'graphql';
import { createTypeComposer, GraphQLDate, GraphQLDecimal, TypeComposer } from '@tira/tira-graphql';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

function loadModelsRecursively(sequelize: any, dir: string) {
  fs.readdirSync(dir)
    .filter((file) => {
      const stat = fs.statSync(path.join(dir, file));
      if (stat.isDirectory()) {
        loadModelsRecursively(sequelize, path.join(dir, file));
      } else if (stat.isFile()) {
        return /\.model\.(js)$/.test(file);
      }
      return false;
    })
    .forEach((file) => {
      sequelize.import(path.join(dir, file));
    });
}

export function loadModels(sequelize: any, dir: string) {
  loadModelsRecursively(sequelize, dir);
  Object.keys(sequelize.models).forEach((modelName) => {
    if ('associate' in sequelize.models[modelName]) {
      sequelize.models[modelName].associate(sequelize.models);
    }
  });
}

export function pickModelAttributes(fields: any, model: any, fieldPath = '') {
  if (!model.attributeNames) {
    model.attributeNames = _.keys(model.attributes);
  }

  if (!fields) {
    return model.attributeNames;
  }

  if (fields && fieldPath && fieldPath.length > 0) {
    const paths = fieldPath.split('/');
    for (let p = 0; p < paths.length; p++) {
      if (fields[paths[p]]) {
        fields = fields[paths[p]];
      } else {
        break;
      }
    }
  }
  const initNames = _.keys(fields);
  let names: string[] = [];
  if (!fields || !model) {
    names = [];
  } else {
    names = _.keys(_.pick(fields, model.attributeNames));
  }
  if (names.length === 0 && initNames.length > 0) {
    names = ['id'];
  }
  return names;
}

const { typeMapper } = require('graphql-sequelize');

typeMapper.mapType((type: any) => {
  if (type.key === 'DECIMAL') {
    return GraphQLDecimal;
  } else if (type.key === 'DATE') {
    return GraphQLDate;
  }
  return false;
});

function parseModelFields(Model: any, options: any): any {
  const cache = options.cache || {};
  const result = Object.keys(Model.rawAttributes).reduce((memo: any, key: any) => {
    if (options.exclude) {
      if (typeof options.exclude === 'function' && options.exclude(key)) {
        return memo;
      }
      if (Array.isArray(options.exclude) && ~options.exclude.indexOf(key)) {
        return memo;
      }
    }
    if (options.only) {
      if (typeof options.only === 'function' && !options.only(key)) {
        return memo;
      }
      if (Array.isArray(options.only) && !~options.only.indexOf(key)) {
        return memo;
      }
    }

    const attribute = Model.rawAttributes[key];
    const type = attribute.type;

    if (options.map) {
      if (typeof options.map === 'function') {
        key = options.map(key) || key;
      } else {
        key = options.map[key] || key;
      }
    }

    memo[key] = {
      type: typeMapper.toGraphQL(type, Model.sequelize.constructor),
    };

    if (memo[key].type instanceof GraphQLEnumType) {
      const typeName = `${Model.name}${key}EnumType`;
      /*
       Cache enum types to prevent duplicate type name error
       when calling attributeFields multiple times on the same model
       */
      if (cache[typeName]) {
        memo[key].type = cache[typeName];
      } else {
        memo[key].type.name = typeName;
        cache[typeName] = memo[key].type;
      }
    }

    if (!options.allowNull) {
      if (attribute.allowNull === false || attribute.primaryKey === true) {
        memo[key].type = new GraphQLNonNull(memo[key].type);
      }
    }

    if (options.commentToDescription) {
      if (typeof attribute.comment === 'string') {
        memo[key].description = attribute.comment;
      }
    }

    return memo;
  }, {});

  result['id'] = {
    name: 'id',
    description: '唯一标识/主键/外键',
    type: GraphQLString,
  };

  return result;
}

const convertedModelsByName: any = {};
const convertedGraphQLTypesByName: any = {};

export function convertFromSequelizeModel(
  model: any,
  exclude: string[] = [],
  extraFields: any = null,
  customFields?: any,
): TypeComposer<any> {
  exclude.push('deletedAt');
  const fields = parseModelFields(model, {
    exclude,
    globalId: false,
    allowNull: true,
    commentToDescription: true,
  });
  if (fields.id) {
    fields.id.description = '唯一标识／主key';
  }
  if (fields.createdAt) {
    fields.createdAt.description = '创建时间';
  }
  if (fields.updatedAt) {
    fields.updatedAt.description = '修改时间';
  }
  if (customFields) {
    customFields.map((field: any) => {
      fields[field.fieldName] = field.fieldInfo;
    });
  }
  if (extraFields) {
    for (const k in extraFields) {
      fields[k] = extraFields[k];
    }
  }

  const graphqlType = createTypeComposer({
    description: model.comment,
    name: model.name,
    fields,
  });
  convertedModelsByName[model.name] = model;
  convertedGraphQLTypesByName[model.name] = graphqlType;
  return graphqlType;
}

export function generateAssociationsOfConvertedGraphQLTypes() {
  for (const modelName in convertedGraphQLTypesByName) {
    const model = convertedModelsByName[modelName];
    const graphqlType = convertedGraphQLTypesByName[modelName];
    for (const associatName in model.associations) {
      const association = model.associations[associatName];
      if (!association.options.disableGenerateGQLAssociation) {
        const associatModelName = association.target.name;
        let associatGraphQLType = convertedGraphQLTypesByName[associatModelName];
        if (association.associationType === 'HasMany') {
          associatGraphQLType = [associatGraphQLType];
        }
        const associatDescription = association.options.description;
        graphqlType.addFields({
          [association.as]: {
            description: associatDescription,
            type: associatGraphQLType,
          },
        });
      }
    }
  }
}

export function convertFromSequelizeModels(models: any): any {
  const convertedGraphQLTypes: any = {};
  for (const k in models) {
    const model = models[k];
    convertedGraphQLTypes[k + 'TC'] = convertFromSequelizeModel(model);
  }
  generateAssociationsOfConvertedGraphQLTypes();
  return convertedGraphQLTypes;
}
