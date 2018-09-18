import { createTypeComposer } from '../util';

export const PaginationInfoType = createTypeComposer({
  description: '分页信息',
  name: 'PaginationDetail',
  fields: {
    currentPage: {
      type: 'Int!',
      description: '当前页码(0开始编号）',
    },
    perPage: {
      type: 'Int!',
      description: '每页项目数',
    },
    pageCount: {
      type: 'Int!',
      description: '总页数',
    },
    itemCount: {
      type: 'Int!',
      description: '总项目数',
    },
    hasNextPage: {
      type: 'Boolean!',
      description: '是否有下/后一页',
    },
    hasPreviousPage: {
      type: 'Boolean!',
      description: '是否有上/前一页',
    },
  },
});

export const PageInfoType = createTypeComposer({
  description: '分页信息',
  name: 'PageDetail',
  fields: {
    hasNextPage: {
      type: 'Boolean!',
      description: '向下翻页时是否还有更多项目',
    },
    hasPreviousPage: {
      type: 'Boolean!',
      description: '向上翻页时是否还有更多项目',
    },
    startCursor: {
      type: 'String',
      description: '向上翻页时，起始项目的光标位置',
    },
    endCursor: {
      type: 'String',
      description: '向下翻页时，起始项目的光标位置',
    },
  },
});
