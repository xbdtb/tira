import * as fs from 'fs';

export function playground({
  htmlFilePath = 'public/graphql/playground.html',
  templateParams = { endpoint: '/graphql' },
}: {
  htmlFilePath?: string;
  templateParams?: { [key: string]: string };
}) {
  return function(req: any, res: any, next: any) {
    if (req.query.extensions) {
      const extensions = JSON.parse(req.query.extensions);
      if (extensions.persistedQuery) {
        return next();
      }
    }
    fs.readFile(htmlFilePath, 'utf-8', (err: Error, content: string) => {
      if (err) {
        console.log(err);
        return;
      }
      for (let key in templateParams) {
        const value = templateParams[key];
        content = content.replace('${' + key + '}', value);
      }
      res.send(content);
    });
  };
}
