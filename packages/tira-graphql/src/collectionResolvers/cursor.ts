export function base64(i: string): string {
  return Buffer.from(i, 'ascii').toString('base64');
}

export function unbase64(i: string): string {
  return Buffer.from(i, 'base64').toString('ascii');
}

export function cursorToData(cursor: string): string {
  return cursor;
  // if (typeof cursor === 'string') {
  //   try {
  //     return JSON.parse(unbase64(cursor)) || null;
  //   } catch (err) {
  //     return null;
  //   }
  // }
  // return null;
}

export function dataToCursor(data: any): string {
  if (data instanceof Date) {
    return data.toISOString();
  } else if (typeof data === 'object') {
    return JSON.stringify(data);
  } else if (data) {
    return data.toString();
  } else {
    return data;
  }
  // return base64(JSON.stringify(data));
}
