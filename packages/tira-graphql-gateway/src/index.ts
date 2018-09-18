import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as morgan from 'morgan';

import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as methodOverride from 'method-override';
import * as express from 'express';
import * as session from 'express-session';
import * as passport from 'passport';
import * as redis from 'connect-redis';
import { ApolloServer } from 'apollo-server-express';
import { RedisCache as ApolloRedisCache } from 'apollo-server-cache-redis';
import { GraphQLSchema } from 'graphql';

const RedisSessionStore = redis(session);

export default class TiraGraphQLGateway {
  private app: any;
  private rootRouter = express.Router();

  constructor(
    private options: {
      serverPort?: number;
      controllerPath?: string;
      redisConfig?: { host: string; port: number; password: string };
      sessionSecret?: string;
      cookieMaxAge?: number;
      schema?: GraphQLSchema;
    },
  ) {}

  public start() {
    const app = express();
    app.disable('x-powered-by');
    this.app = app;
    this.mountMiddlewares(app);
    const server = http.createServer(app);
    const serverPort = this.options.serverPort || 4000;
    server.listen(serverPort, () => {
      console.log(`Server is running at http://127.0.0.1:${serverPort}.`);
    });
  }

  private mountControllers(controllerPath: string, baseUrlPath: string = '/') {
    const fullPath = path.resolve(process.cwd(), controllerPath);
    this.loadControllersRecursive(fullPath, baseUrlPath);
    this.app.use(baseUrlPath, this.rootRouter);
  }

  private loadControllersRecursive(dir: string, url: string) {
    try {
      if (!fs.existsSync(dir)) {
        return;
      }
      fs.readdirSync(dir).forEach((file) => {
        const path = dir + '/' + file;
        const stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
          let baseUrl = url;
          if (baseUrl === '/') {
            baseUrl = baseUrl + file;
          } else {
            baseUrl = baseUrl + '/' + file;
          }
          this.loadControllersRecursive(path, baseUrl);
        } else if (/\.(js)$/.test(path)) {
          const router = express.Router();
          require(path).default(this.app, router);
          this.rootRouter.use(url, router);
        }
      });
    } catch (err) {
      console.log(err.stack);
    }
  }

  mountMiddlewares(app: any) {
    app.use(morgan('dev'));

    const sessionMiddleware = express.Router();
    sessionMiddleware.use(
      session({
        cookie: { maxAge: this.options.cookieMaxAge || 60000 * 60 * 24 * 30 },
        store: this.options.redisConfig ? new RedisSessionStore(this.options.redisConfig) : undefined,
        secret: this.options.sessionSecret || 'tira',
        resave: true,
        rolling: true,
        saveUninitialized: true,
      }),
    );
    sessionMiddleware.use(passport.initialize());
    sessionMiddleware.use(passport.session());

    app.use((req: any, res: any, next: any) => {
      if (req.method.toUpperCase() === 'GET' && req.originalUrl === '/login') {
        if (req.user && req.user.userId) {
          return res.redirect('/');
        }
      }
      next();
    });

    app.use(express.static(path.resolve(process.cwd(), 'public')));

    app
      .use(cookieParser())
      .use(compression({}))
      .use(bodyParser.json())
      .use(methodOverride())
      .use(
        bodyParser.urlencoded({
          extended: true,
        }),
      );

    app.use((req: any, res: any, next: any) => {
      if (req && req.headers.authorization && req.headers.authorization.indexOf('Bearer') === 0) {
        app.use(passport.initialize());
        passport.authenticate('bearer', { session: false })(req, res, next);
      } else {
        sessionMiddleware(req, res, next);
      }
    });
    this.mountControllers(this.options.controllerPath || 'dist/server/controllers');
    app.get('/graphql', (req: any, res: any, next: any) => {
      if (req.query.extensions) {
        const extensions = JSON.parse(req.query.extensions);
        if (extensions.persistedQuery) {
          return next();
        }
      }
      res.sendFile(path.resolve(path.resolve(process.cwd(), 'public/graphql/playground.html')));
    });
    if (this.options.schema) {
      const apolloServer = new ApolloServer({
        schema: this.options.schema,
        subscriptions: false,
        tracing: true,
        cacheControl: { defaultMaxAge: 2592000, calculateHttpHeaders: true, stripFormattedExtensions: false },
        engine: false,
        persistedQueries: {
          cache: new ApolloRedisCache(this.options.redisConfig || {}),
        },
        introspection: true,
        playground: {
          settings: {
            'general.betaUpdates': false,
            'editor.cursorShape': 'line',
            'editor.fontSize': 14,
            'editor.fontFamily': `'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`,
            'editor.theme': 'light',
            'editor.reuseHeaders': true,
            'prettier.printWidth': 80,
            'request.credentials': 'include',
            'tracing.hideTracingResponse': true,
          },
        },
        context: (req: any) => req,
      });
      apolloServer.applyMiddleware({ app, path: '/graphql' });
    }

    app.use((req: any, res: any, next: any) => {
      req.url = '/index.html';
      next();
    });

    app.use(express.static(path.resolve(process.cwd(), 'public')));

    return null;
  }
}
