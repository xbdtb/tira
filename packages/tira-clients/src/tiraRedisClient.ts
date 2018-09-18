import * as redis from 'redis';
import { RedisClient } from 'redis';

export class TiraRedisClient {
  public client?: RedisClient;

  constructor(
    option: { host: string; port: number; password: string; database: string } = {
      host: 'localhost',
      port: 6379,
      password: '',
      database: '',
    },
  ) {
    const client: RedisClient = redis.createClient(option);

    client.on('connect', () => {
      return console.log('redis connected!');
    });

    if (option.database) {
      client.select(option.database);
    }

    client.on('error', (err) => {
      console.log('Error ' + err);
    });

    this.client = client;
  }

  set(type: string, key: string, value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.client) {
        return resolve();
      }
      this.client.set(type + ':' + key, JSON.stringify(value), (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  setex(type: string, key: string, seconds: number, value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.client) {
        return resolve();
      }
      this.client.setex(type + ':' + key, seconds, JSON.stringify(value), (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  get(type: string, key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!this.client) {
        return resolve();
      }
      this.client.get(type + ':' + key, (err: any, reply) => {
        if (err) {
          reject(err);
        }
        if (reply) {
          const o = JSON.parse(reply);
          resolve(o);
        } else {
          resolve(null);
        }
      });
    });
  }

  del(type: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        return resolve();
      }
      this.client.del(type + ':' + key, (err: any, reply) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  expire(type: string, key: string, seconds: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.client) {
        return resolve();
      }
      this.client.expire(type + ':' + key, seconds, (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  mget(type: string, keys: string[]): Promise<any[]> {
    return new Promise<[any]>((resolve, reject) => {
      if (!this.client) {
        return resolve();
      }
      const typeKeys: string[] = [];
      keys.forEach((key) => {
        typeKeys.push(type + ':' + key);
      });
      this.client.mget(typeKeys, (err, replies) => {
        if (err) {
          reject(err);
        }

        if (replies != null) {
          const objects: any[] = [];
          replies.forEach((reply) => {
            const o = JSON.parse(reply);
            objects.push(o);
          });
        } else {
          resolve();
        }
      });
    });
  }
}
