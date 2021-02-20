import { createConnection, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import Connection from 'mysql2/typings/mysql/lib/Connection';
import Query from 'mysql2/typings/mysql/lib/protocol/sequences/Query';
import NodeCache from 'node-cache';
import { Schema } from './schema-types';
import { Table, TablePartial, TableValue } from './table';

export interface DatabaseOptions {
  host: string
  port?: number
  user: string
  password?: string
  database: string
  cacheTTL?: number // -1 to disable
}

// since we do this[tableName], i want to keep most properties with a _ prefix, so we can reduce
// the types of things that are "reserved table names"
class DatabaseClass {
  private _cache: NodeCache | null;
  private _options: DatabaseOptions;
  private _conn: Connection

  constructor(options: DatabaseOptions, tables: any) {
    this._options = options;
    this._options.cacheTTL = options.cacheTTL || 300
    this._cache = (this._options.cacheTTL > -1) ? new NodeCache({ stdTTL: options.cacheTTL }) : null;

    this._conn = createConnection(this._options);

    Object.keys(tables).forEach((name) => {
      (this as any)[name] = new Table(name, this as any, tables[name]);
    })
  }

  // Exposes query function for advanced used but turns it into a Promise instead of callback
  private _query(sql: string, placeholderValues: any[]): Promise<Query.QueryError | RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this._conn.query(sql, placeholderValues, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  // query function that's cached if cache is enabled
  public query(sql: string, placeholderValues: any[]): Promise<Query.QueryError | RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader> {
    return new Promise(async (resolve, reject) => {
      // if select in cache, return cache
      this._query(sql, placeholderValues)
        .then(result => {
          resolve(result);
          // remove if delete/update/insert and in cache
          // add to cache if select
        })
        .catch(reject);
    });
  }

  // close the mysql connection
  public close() {

  }
}

export type DatabaseConstructor = {
  new<S extends Record<string, Schema>>(options: DatabaseOptions, tables: S): Database<S>;
};
export type Database<S extends Record<string, Schema> = {}> = {
  [K in keyof S]: Table<S[K]>
} & DatabaseClass;
export const Database = DatabaseClass as any as DatabaseConstructor;

export type DbTableValue<D extends Database, T extends { [K in keyof D]: D[K] extends Table<any> ? K : never }[keyof D]> = TableValue<D[T]>;
export type DbTablePartial<D extends Database, T extends { [K in keyof D]: D[K] extends Table<any> ? K : never }[keyof D]> = TablePartial<D[T]>;
