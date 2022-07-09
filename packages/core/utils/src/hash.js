// @flow strict-local

import type {Readable} from 'stream';
import type {FileSystem} from '@parcel/fs';

import {objectSortedEntriesDeep} from './collection';
import {hashBuffer, hashString, Hash} from '@parcel/hash';

export function hashStream(stream: Readable): Promise<string> {
  let hash = new Hash();
  return new Promise((resolve, reject) => {
    stream.on('error', err => {
      reject(err);
    });
    stream
      .on('data', chunk => {
        hash.writeBuffer(chunk);
      })
      .on('end', function () {
        resolve(hash.finish());
      })
      .on('error', err => {
        reject(err);
      });
  });
}

export function hashObject(obj: {+[string]: mixed, ...}): string {
  return hashString(JSON.stringify(objectSortedEntriesDeep(obj)));
}

let testCache: {|[string]: Promise<string>|} = {
  /*:: ...null */
};
export async function hashFile(
  fs: FileSystem,
  filePath: string,
): Promise<string> {
  if (process.env.PARCEL_BUILD_ENV === 'test') {
    // Development builds of these native modules are especially big and slow to hash.
    if (
      /parcel-swc\.[^\\/]+\.node$|lightningcss.[^\\/]+.node$/.test(filePath)
    ) {
      let cacheEntry = testCache[filePath];
      if (cacheEntry) return cacheEntry;
      let v = fs.readFile(filePath).then(content => hashBuffer(content));
      testCache[filePath] = v;
      return v;
    }
  }
  return hashBuffer(await fs.readFile(filePath));
}
