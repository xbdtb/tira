import * as path from 'path';
import { config } from '../../config';
import { loadModels } from '@tira/tira-graphql-sequelize';

export const Sequelize = require('sequelize');

export const sequelize = new Sequelize(config.mysql.connectionString(), {
  timezone: '+08:00',
  pool: {
    maxConnections: 20,
  },
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  operatorsAliases: false,
  logging: (text: any) => {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      console.log(text);
    }
  },
});

loadModels(sequelize, path.resolve(process.cwd(), 'dist/server/models/sequelize'));

export const models = sequelize.models;
export default models;

export const { Todo } = models;
