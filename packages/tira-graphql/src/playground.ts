import * as fs from 'fs';

export function playground({
  resourceFilePath = 'public/playground',
  templateParams = { endpoint: '/graphql' },
}: {
  resourceFilePath?: string;
  templateParams?: { [key: string]: string };
}) {
  return function(req: any, res: any, next: any) {
    if (req.query.extensions) {
      const extensions = JSON.parse(req.query.extensions);
      if (extensions.persistedQuery) {
        return next();
      }
    }
    const filePath = req.url.replace(templateParams.endpoint, '') || '/index.html';
    fs.readFile(resourceFilePath + filePath, 'utf-8', (err: Error, content: string) => {
      if (err) {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (filePath === '/index.html') {
        for (let key in templateParams) {
          const value = templateParams[key];
          const reg = new RegExp('##' + key + '##', 'g');
          content = content.replace(reg, value);
        }
      }
      res.send(content);
    });
  };
}
