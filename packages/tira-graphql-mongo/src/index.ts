import * as mongoose from 'mongoose';
import { composeWithMongoose, convertModelToGraphQL } from 'graphql-compose-mongoose';
import { TypeComposer } from 'graphql-compose';

const mongoose_delete = require('mongoose-delete');

export function convertFromMongoModel(model: any, name: string): TypeComposer<any> {
  const tc = convertModelToGraphQL(model, name);
  delete model.schema._gqcTypeComposer;
  return tc;
}

export function composeFromMongoModel(model: any, opts: any): TypeComposer<any> {
  const tc = composeWithMongoose(model, opts);
  delete model.schema._gqcTypeComposer;
  return tc;
}

function convertType(type: any): any {
  if (Array.isArray(type)) {
    return [convertType(type[0])];
  } else {
    if (
      typeof type === 'object' &&
      !(type instanceof mongoose.Schema) &&
      !(type instanceof mongoose.Schema.Types.Mixed)
    ) {
      return convertSchemaMap(type);
    } else {
      return type;
    }
  }
}

function convertFieldMap(fieldMap: any): any {
  const fieldMapConverted: any = {};
  for (const fieldName in fieldMap) {
    if (fieldName === '$type') {
      fieldMapConverted.type = convertType(fieldMap.$type);
    } else if (fieldName.substr(0, 1) === '$') {
      fieldMapConverted[fieldName.substr(1, fieldName.length - 1)] = fieldMap[fieldName];
    }
  }
  return fieldMapConverted;
}

function convertSchemaMap(schemaMap: any, schemaOptions: any = { _id: false }): mongoose.Schema {
  const schemaMapConverted: any = {};
  for (const fieldName in schemaMap) {
    const fieldMap = schemaMap[fieldName];
    const fieldMapConverted = convertFieldMap(fieldMap);
    schemaMapConverted[fieldName] = fieldMapConverted;
  }
  return new mongoose.Schema(schemaMapConverted, schemaOptions);
}

export function createModel(
  modelName: string,
  schemaMap: any,
  hook: (schema: mongoose.Schema) => void,
): mongoose.Model<any> {
  schemaMap._id = {
    $description: '主key',
    $type: 'ObjectId',
  };
  const ModelSchema = convertSchemaMap(schemaMap, { _id: true, timestamps: true });
  if (hook) {
    hook(ModelSchema);
  }
  ModelSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy: true });
  const Model: any = mongoose.model(modelName, ModelSchema, modelName);
  Model.schemaMap = schemaMap;
  return Model;
}
