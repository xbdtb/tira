import * as fs from 'fs';

const GitRevisionPlugin = require('git-revision-webpack-plugin');

export default (app: any, router: any) => {
  router.get('/version', (req: any, res: any, next: any) => {
    console.log(req.sessionID);
    const gitRevisionPlugin = new GitRevisionPlugin({
      versionCommand: 'rev-list --count ' + new GitRevisionPlugin().branch(),
    });
    let BUILD_NUMBER = '';
    const path = process.cwd() + '/BUILD_NUMBER';
    if (fs.existsSync(path)) {
      BUILD_NUMBER = fs.readFileSync(path, 'utf8');
      BUILD_NUMBER = BUILD_NUMBER.replace('\n', '');
    }
    res.json({
      VERSION: '1.0.' + gitRevisionPlugin.version(),
      COMMIT_HASH: gitRevisionPlugin.commithash(),
      BRANCH: gitRevisionPlugin.branch(),
      HOSTNAME: process.env.HOSTNAME,
      BUILD_NUMBER,
    });
  });
};
