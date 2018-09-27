import * as passport from 'passport';
import {config} from '../config';

const BearerStrategy = require('passport-http-bearer');

export default (app: any, router: any) => {
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

  passport.use(
    new BearerStrategy((token: string, done: any) => {
      if (token === config.systemBearerToken) {
        return done(null, {});
      } else {
        return done(new Error('Unauthorized'));
      }
    }),
  );
};
