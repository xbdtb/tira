const fs = require('fs');
const path = require('path');

const schemaConfigFilePath = path.resolve(process.cwd(), './schema.config.js');
let graphqlRules = {};
if (fs.existsSync(schemaConfigFilePath)) {
  const schemaConfig = require(schemaConfigFilePath);
  if (schemaConfig.frontend && schemaConfig.frontend.schemaPath) {
    const schemaFilePath = path.resolve(process.cwd(), schemaConfig.frontend.schemaPath, 'schema.json');
    if (fs.existsSync(schemaFilePath)) {
      graphqlRules = {
        'graphql/template-strings': [
          'error',
          {
            env: 'apollo',
            schemaJson: require(schemaFilePath),
            tagName: 'gql',
          },
        ],
        'graphql/named-operations': [
          'error',
          {
            env: 'apollo',
            schemaJson: require(schemaFilePath),
            tagName: 'gql',
          },
        ],
      };
    }
  }
}

module.exports = {
  parser: 'babel-eslint',
  extends: ['prettier', 'prettier/flowtype', 'prettier/react', 'standard-react'],
  plugins: ['babel', 'graphql', 'promise', 'prettier'],
  env: {
    browser: true,
  },
  globals: {
    __DEV__: false,
    fetch: false,
    localStorage: false,
    alert: false,
    Image: false,
  },
  rules: {
    ...graphqlRules,
    'jsx-quotes': [2, 'prefer-double'],
    'react/jsx-indent': [0, 2],
    'prettier/prettier': [
      'error',
      {
        printWidth: 120,
        semi: true,
        singleQuote: true,
        bracketSpacing: true,
        jsxBracketSameLine: false,
        trailingComma: 'all',
        arrowParens: 'always',
      },
    ],
  },
};
