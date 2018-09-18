import { createResolver, createTypeComposer } from '../';
import { PageInfoType, PaginationInfoType } from './types';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLNonNull } from 'graphql-compose/lib/graphql';
import { cursorToData, dataToCursor } from './cursor';
import { InputTypeComposer, TypeComposer } from 'graphql-compose';

type GetManyArgsType = {
  filter?: any;
  sort?: any;
  page?: {
    filter?: any;
    skip: number;
    limit: number;
  };
};

function prepareEdges(rows: any[], before: string, limit: number, cursorFieldName: string): any[] {
  const edges: any[] = [];
  rows = rows.length > limit ? rows.slice(0, limit) : rows;
  if (before) {
    rows.reverse();
  }
  rows.forEach((item) => {
    edges.push({
      node: item,
      cursor: dataToCursor(item[cursorFieldName || '_id']),
    });
  });

  return edges;
}

function preparePageInfo(
  rows: any[],
  edges: any[],
  after: string,
  first: number,
  before: string,
  last: number,
  skip: number,
  limit: number,
) {
  const pageInfo = {
    startCursor: '',
    endCursor: '',
    hasPreviousPage: false,
    hasNextPage: false,
  };

  const hasExtraItems = rows.length > limit;

  if (edges.length > 0) {
    pageInfo.startCursor = edges[0].cursor;
    pageInfo.endCursor = edges[edges.length - 1].cursor;
  }
  pageInfo.hasPreviousPage = !before ? !!after : hasExtraItems;
  pageInfo.hasNextPage = !before ? hasExtraItems : !!before;

  return pageInfo;
}

function prepareConnection(
  result: any,
  cursorFieldName: string,
  after: string,
  first: number,
  before: string,
  last: number,
  skip: number,
  limit: number,
) {
  const edges = prepareEdges(result.rows, before, limit, cursorFieldName);
  const pageInfo = preparePageInfo(result.rows, edges, after, first, before, last, skip, limit);
  const connection = {
    count: result.count,
    edges,
    pageInfo,
  };
  return connection;
}

export function createCollectionTCResolver(
  tc: TypeComposer,
  parentOutputTypeName: string,
  {
    typeName = null,
    filterFields = {},
    filterNonNull = false,
    sortFields = [],
    defaultSortIndex = 0,
    cursorField = null,
    limitDefaultValue = 1000,
    description = '获取满足条件的数据',
    getManyResolveFn = async (
      source: any,
      args: GetManyArgsType,
      context: any,
      projection: any,
      info: any,
      fields: any,
    ) => null,
  }: any,
): any {
  typeName = typeName || tc.getTypeName();
  let filterInputType: InputTypeComposer | GraphQLNonNull<GraphQLInputObjectType> = createTypeComposer({
    name: `GetMany${typeName}Filter`,
    fields: filterFields,
  }).getInputTypeComposer();
  if (filterNonNull) {
    filterInputType = filterInputType.getTypeNonNull();
  }

  const sortEnumConfig: any = {};
  if (sortFields && sortFields.length > 0) {
    const sortCount = Math.pow(2, sortFields.length);
    for (let i = 0; i < sortCount; i++) {
      let bitMask = 1;
      let sortFullEnumKeyName = '';
      const sortEnumValue: any = { value: {} };
      for (let j = 0; j < sortFields.length; j++) {
        const sortFieldName = sortFields[sortFields.length - j - 1];
        const sortEnumKeyName =
          sortFieldName.toUpperCase().replace(/[^_a-zA-Z0-9]/i, '__') + (i & bitMask ? '_ASC' : '_DESC');
        if (j > 0) {
          sortFullEnumKeyName = '_' + sortFullEnumKeyName;
        }
        sortFullEnumKeyName = sortEnumKeyName + sortFullEnumKeyName;
        sortEnumValue.value[sortFieldName] = i & bitMask ? 1 : -1;
        bitMask <<= 1;
      }
      sortEnumConfig[sortFullEnumKeyName] = sortEnumValue;
    }
  }

  const args: any = {};

  if (Object.keys(filterFields).length > 0) {
    args['filter'] = {
      description: '过滤条件',
      type: filterInputType,
      defaultValue: {},
    };
  }

  if (sortFields.length > 0) {
    const sortEnumType = new GraphQLEnumType({
      name: `Sort${typeName}Enum`,
      values: sortEnumConfig,
    });
    args['sort'] = {
      description: '排序方式',
      type: sortEnumType,
      defaultValue: sortEnumType.getValues()[defaultSortIndex].value,
    };
  }

  const getManyResolverName = 'getMany';
  const getPaginationResolverName = 'getPagination';
  const getConnectionResolverName = 'getConnection';

  const getManyResolver = createResolver({
    description: description + '（不分页，无分页信息）',
    name: getManyResolverName,
    args: {
      ...args,
      skip: {
        description: '数据偏移量',
        type: 'Int',
      },
      limit: {
        description: '结果限制数量',
        type: 'Int',
        defaultValue: limitDefaultValue || 1000,
      },
    },
    outputTC: [tc],
    resolve: async (source: any, args: any, context: any, projection: any, info: any) => {
      const result = await getManyResolveFn(
        source,
        {
          filter: args.filter,
          sort: args.sort,
          page: {
            filter: { ...args.filter },
            cursorFilter: {},
            skip: args.skip || 0,
            limit: args.limit,
          },
        },
        context,
        projection,
        info,
        projection,
      );
      return result.rows;
    },
  });

  const paginationType = createTypeComposer({
    name: typeName + 'Pagination',
    description: '分页数据',
    fields: {
      count: {
        description: '符合查询条件的记录总数',
        type: 'Int',
      },
      rows: {
        description: '项目列表',
        type: [tc],
      },
      pageInfo: {
        description: '分页信息',
        type: PaginationInfoType,
      },
    },
  });

  const getPaginationResolver = createResolver({
    description: description + '（按页码分页）',
    name: getPaginationResolverName,
    args: {
      ...args,
      pageNo: {
        type: 'Int',
        description: '页码',
      },
      perPage: {
        type: 'Int',
        description: '每页数量，与page配合使用',
        defaultValue: 20,
      },
    },
    outputTC: paginationType,
    resolve: async (source: any, args: any, context: any, projection: any, info: any) => {
      const perPage = args.perPage || 20;
      const pageNo = args.pageNo || 0;
      const skip = perPage * pageNo;
      const limit = perPage;

      const getManyResult = await getManyResolveFn(
        source,
        {
          filter: args.filter,
          sort: args.sort,
          page: {
            filter: { ...args.filter },
            skip,
            limit: limit + 1,
          },
        },
        context,
        projection,
        info,
        projection['rows'],
      );

      const rows = getManyResult.rows;
      const pageCount = Math.ceil(getManyResult.count / perPage);
      const pagination = {
        count: getManyResult.count,
        rows: rows.length > limit ? rows.slice(0, limit) : rows,
        pageInfo: {
          currentPage: pageNo,
          perPage,
          pageCount,
          itemCount: getManyResult.count,
          hasNextPage: getManyResult.rows.length > limit,
          hasPreviousPage: pageNo > 0,
        },
      };
      return pagination;
    },
  });

  const edgeType = createTypeComposer({
    name: typeName + 'Edge',
    description: '列表中的单条项目信息',
    fields: {
      node: {
        description: '列表中的单条项目对应的原始类型',
        type: tc,
      },
      cursor: {
        description: '当前项目的游标位置',
        type: 'String',
      },
    },
  });

  const connectionType = createTypeComposer({
    name: typeName + 'Connection',
    description: '贯标分页数据',
    fields: {
      count: {
        description: '符合查询条件的记录总数',
        type: 'Int',
      },
      edges: {
        description: '项目列表',
        type: [edgeType],
      },
      pageInfo: {
        description: '分页信息',
        type: PageInfoType,
      },
    },
  });

  const getConnectionResolver = createResolver({
    description: description + '（按光标分页）',
    name: getConnectionResolverName,
    args: {
      ...args,
      after: {
        description: '分页参数，从此光标位置开始（不包括本光标对应项目）往下/后',
        type: 'String',
      },
      first: {
        type: 'Int',
        description: '下/后n项，与after配合使用',
      },
      before: {
        description: '分页参数，从此光标位置开始（不包括本光标对应项目）往上/前',
        type: 'String',
      },
      last: {
        type: 'Int',
        description: '上/前n项，与before配合使用',
      },
    },
    outputTC: connectionType,
    resolve: async (source: any, args: any, context: any, projection: any, info: any) => {
      let { after, first, before, last } = args;
      first = first || 20;
      last = last || 20;
      if (after) {
        after = cursorToData(after);
      }
      if (before) {
        before = cursorToData(before);
      }
      const sort = Object.assign({}, args.sort);
      let cursorFieldName = null;
      if (sortFields.length > 0) {
        cursorFieldName = sortFields[0];
      }
      let skip = 0;
      let limit = 0;
      const cursorFilter: any = {};
      if (!before) {
        skip = 0;
        limit = first;
        if (cursorFieldName && after) {
          if (args.sort[cursorFieldName] < 0) {
            cursorFilter[cursorFieldName] = { $lt: after };
          } else {
            cursorFilter[cursorFieldName] = { $gt: after };
          }
        }
      } else {
        skip = 0;
        limit = last;
        if (cursorFieldName) {
          sort[cursorFieldName] = -sort[cursorFieldName];
          if (args.sort[cursorFieldName] > 0) {
            cursorFilter[cursorFieldName] = { $lt: before };
          } else {
            cursorFilter[cursorFieldName] = { $gt: before };
          }
        }
      }
      const getManyResult = await getManyResolveFn(
        source,
        {
          filter: args.filter,
          sort,
          page: {
            filter: { ...args.filter, ...cursorFilter },
            cursorFilter,
            skip,
            limit: limit + 1,
          },
        },
        context,
        projection,
        info,
        { ...projection['edges']['node'], [cursorFieldName]: {} },
      );
      if (!cursorField) {
        cursorField = cursorFieldName;
      }
      const connection = prepareConnection(getManyResult, cursorField, after, first, before, last, skip, limit);
      return connection;
    },
  });

  const parentTC = createTypeComposer({
    description,
    name: parentOutputTypeName,
    fields: {
      getMany: getManyResolver,
      getPagination: getPaginationResolver,
      getConnection: getConnectionResolver,
    },
  });

  const parentResolver = createResolver({
    description,
    name: parentOutputTypeName,
    outputTC: parentTC,
    resolve: () => {
      return {};
    },
  });
  return parentResolver;
}
