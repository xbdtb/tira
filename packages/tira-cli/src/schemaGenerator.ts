import * as path from 'path';
import { generateJsonFileByUrl } from '@tira/tira-graphql';

const schemaConfigFile = 'schema.config.js';

export async function generateFrontendSchema() {
  const schemaConfig = require(path.resolve(process.cwd(), schemaConfigFile));
  if (schemaConfig.frontend) {
    const generatePath = path.resolve(process.cwd(), schemaConfig.frontend.schemaPath);
    await generateJsonFileByUrl(schemaConfig.frontend.remoteUrl, generatePath);
  }
}

export async function generateBackendSchema() {
  const schemaConfig = require(path.resolve(process.cwd(), schemaConfigFile));
  if (schemaConfig.backend) {
    const generatePath = path.resolve(process.cwd(), schemaConfig.backend.schemaPath);
    await generateJsonFileByUrl(schemaConfig.backend.remoteUrl, generatePath);
  }
}
