## Getting Started

1.install

```
npm i -g lerna
npm i -g @tira/tira-cli
```

2.make a workspace

```
mkdir workspace && cd workspace
tira init -t workspace
```

3.make sub project package directory and generate some projects

```
mkdir packages && cd packages
mkdir frontend && cd frontend
tira init -t frontend-server
cd ..
mkdir backend && cd backend
tira init -t graphql-server
```

4.goto the root directory of the workspace and bootstrap the workspace

```
cd ../../
npm run bootstrap
```

this will install all dependencies of all project into the root node_modules of the workspace

5.start the projects in the root directory of each project

```
npm start
```

6.now you can start coding the client side with hot reloading and server side source file with auto restarting the node process

7.watching typescript file of all projects and you can run the server side code in debug mode

```
npm run watch-tsc
```

## Features

1.ES6、Typescript support

2.graphql support based on apollo

3.support graphql gateway and make it possible to developing large micro service projects

4.simple way to convert sequelize models and relations to graphql types

5.linting with js/jsx/ts/tsx/json/css/less/scss/|yaml/yml/md files and graphql query statements based on prettier/eslint/tslint

6.multi project support based on lerna

7.well-designed project generating and updating template
