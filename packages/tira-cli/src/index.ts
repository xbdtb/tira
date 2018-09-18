import * as program from 'commander';
import { initProject, updateProject } from '@tira/tira-project-template';
import { generateFrontendSchema, generateBackendSchema } from './schemaGenerator';

export function cli() {
  program.version('0.1.0', '-v').description('tira cli tool');

  program
    .command('init')
    .description('init a new project in current directory')
    .option(
      '-t, --type [type]',
      'Project type: workspace|graphql-server|frontend-server|graphql-gateway',
      /^(workspace|graphql-server|frontend-server|graphql-gateway)$/i,
      'workspace',
    )
    .action((cmd) => {
      initProject(cmd.type);
    });

  program
    .command('update')
    .description(
      'update common files in the current project from the latest version of the template that specified in the package.json',
    )
    .action((cmd) => {
      updateProject();
    });

  program
    .command('generateFrontendSchema')
    .description('generate frontend scheme')
    .action((cmd) => {
      generateFrontendSchema();
    });

  program
    .command('generateBackendSchema')
    .description('generate backend scheme')
    .action((cmd) => {
      generateBackendSchema();
    });

  program.parse(process.argv);
}
