import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as morgan from 'morgan';

import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as methodOverride from 'method-override';
import * as express from 'express';
import { GatewayEndpoint, GraphQLGatewayProxy } from './graphQLGatewayProxy';

export * from './graphQLGatewayProxy';

export default class TiraGraphQLGateway {
  private app = express();
  private rootRouter = express.Router();

  constructor(
    private options: {
      serverPort?: number;
      controllerPath?: string;
      redisConfig?: { host: string; port: number; password: string };
      sessionSecret?: string;
      cookieMaxAge?: number;
      endpoints: GatewayEndpoint[];
      playgroundHtmlFilePath?: string;
      updateInterval?: number;
      onServerCreated?: (httpServer: any, app: any) => void;
    },
  ) {}

  public start() {
    this.app.disable('x-powered-by');
    this.mountMiddlewares(this.app);
    const server = http.createServer(this.app);
    const serverPort = this.options.serverPort || 4000;
    server.listen(serverPort, () => {
      console.log(`Server is running at http://127.0.0.1:${serverPort}.`);
    });
    if (this.options.onServerCreated) {
      this.options.onServerCreated(server, this.app);
    }
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

    this.mountControllers(this.options.controllerPath || 'dist/server/controllers');

    const proxy = new GraphQLGatewayProxy(
      this.options.endpoints,
      this.options.playgroundHtmlFilePath,
      this.options.updateInterval,
    );
    proxy.applyMiddleware(this.app);

    app.use((req: any, res: any, next: any) => {
      req.url = '/index.html';
      next();
    });

    app.use(express.static(path.resolve(process.cwd(), 'public')));

    return null;
  }
}
