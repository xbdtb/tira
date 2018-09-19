import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore
import * as copydir from 'copy-dir';

function renameFile(dir: string, from: string, to: string) {
  const fromFile = fs.readFileSync(path.resolve(dir, from), 'utf-8');
  fs.writeFileSync(path.resolve(dir, to), fromFile, 'utf-8');
  fs.unlinkSync(path.resolve(dir, from));
}

export function initProject(type: 'workspace' | 'graphql-server' | 'frontend-server' | 'graphql-gateway') {
  const newProjectDir = process.env.PROJECT_DIR || process.cwd();
  const templateDir = path.resolve(__dirname, `../templates/${type}`);
  const newProjectDirExist = fs.existsSync(newProjectDir);
  const templateDirExist = fs.existsSync(templateDir);
  if (!newProjectDirExist || !templateDirExist) {
    return;
  }

  copydir.sync(templateDir, newProjectDir, (stat: any, filepath: string, filename: string) => {
    if (stat === 'directory' && (filename === 'node_modules' || filename === 'dist')) {
      return false;
    }
    return true;
  });

  const packageName = <string>newProjectDir.split(path.sep).pop();
  const packageJsonPath = path.resolve(newProjectDir, './package.json');
  let packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageNameTag = `PACKAGE_NAME_${type}`;
  packageJson = packageJson.replace(packageNameTag, packageName);
  fs.writeFileSync(packageJsonPath, packageJson, 'utf-8');

  renameFile(newProjectDir, 'gitignore', '.gitignore');
  renameFile(newProjectDir, 'npmrc', '.npmrc');

  console.log('init success');
}

export function updateProject() {
  const newProjectDir = process.env.PROJECT_DIR || process.cwd();
  const newProjectDirExist = fs.existsSync(newProjectDir);
  if (!newProjectDirExist) {
    return;
  }

  const packageJsonPath = path.resolve(newProjectDir, './package.json');
  let packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageInfo = JSON.parse(packageJson);
  const templateDir = path.resolve(__dirname, `../templates/${packageInfo['project-type']}`);

  const templateDirExist = fs.existsSync(templateDir);
  if (!templateDirExist) {
    return;
  }

  console.log(newProjectDir);
  console.log(templateDir);

  copydir.sync(templateDir, newProjectDir, (stat: any, filepath: string, filename: string) => {
    if (stat === 'directory' && (filename === 'node_modules' || filename === 'dist')) {
      return false;
    }
    if (
      stat === 'file' &&
      (filename === 'lerna.json' ||
        filename === 'package.json' ||
        filename === 'README.md' ||
        filename === '.sequelizerc.config.js')
    ) {
      return false;
    }
    return true;
  });

  renameFile(newProjectDir, 'gitignore', '.gitignore');
  renameFile(newProjectDir, 'npmrc', '.npmrc');

  console.log('update success');
}
