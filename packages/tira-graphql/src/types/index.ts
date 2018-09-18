import { GraphQLScalarType, Kind } from 'graphql';
import Decimal from 'decimal.js';
import { GQC } from 'graphql-compose';

export const GraphQLDate = new GraphQLScalarType({
  name: 'Date',
  description: '日期/时间类型',
  serialize: String,
  parseValue(value: any) {
    if (typeof value !== 'string') {
      throw new TypeError('Field error: value is an invalid Date');
    }
    return value;
  },
  parseLiteral(ast) {
    return ast.kind === Kind.STRING ? ast.value : null;
  },
});

export const GraphQLDecimal = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal类型',
  serialize: String,
  parseValue(value: any) {
    return value ? new Decimal(value) : 0;
  },
  parseLiteral(ast) {
    return ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT ? ast.value : null;
  },
});

// @ts-ignore
GQC['typeMapper'].set('Date', GraphQLDate);
// @ts-ignore
GQC['typeMapper'].set('Decimal', GraphQLDecimal);
