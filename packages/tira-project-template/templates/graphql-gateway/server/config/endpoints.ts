const endpoints = [
  {
    subPath: '/graphql/1',
    targets: ['http://system1/graphql', 'http://system2/graphql'],
    queryFilter: {
      $include: ['core'],
      core: {
        user: {
          $exclude: ['getPerson'],
        },
      },
    },
  },
  {
    subPath: '/graphql/2',
    targets: ['http://system1/graphql', 'http://system2/graphql'],
  },
];

export default endpoints;
