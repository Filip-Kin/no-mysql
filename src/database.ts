import { Connection, createConnection, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
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
  private _conn: Connection;
  private _tables: Record<string, Table<any>> = {};

  constructor(options: DatabaseOptions, tables: any) {
    this._options = options;
    this._options.cacheTTL = options.cacheTTL || 300
    this._cache = (this._options.cacheTTL > -1) ? new NodeCache({ stdTTL: options.cacheTTL }) : null;

    this._conn = createConnection({
      host: this._options.host,
      port: this._options.port || undefined,
      user: this._options.user,
      password: this._options.password || undefined,
      database: this._options.database
    });

    Object.keys(tables).forEach((name) => {
      if (name.startsWith('_')) {
        throw new Error(`Table name '${name}' cannot start with an _`);
      }
      if (name in DatabaseClass.prototype) {
        throw new Error(`Table name '${name}' cannot conflict with a method of the same name on the Database class.`);
      }
      this._tables[name] = new Table(name, this as any, tables[name]);
      (this as any)[name] = this._tables[name];
    })
  }

  // Exposes query function for advanced used but turns it into a Promise instead of callback
  public __query(sql: string, placeholderValues?: any[]): Promise<SqlResult> {
    return new Promise((resolve, reject) => {
      this._conn.query(sql, placeholderValues || [], (err: Query.QueryError | null, results: SqlResult) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  // query function that's cached if cache is enabled
  public _query(sql: string, placeholderValues?: any[]): Promise<SqlResult> {
    return new Promise(async (resolve, reject) => {
      // if select in cache, return cache
      this.__query(sql, placeholderValues || [])
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
    this._conn.destroy();
  }
}

export type SqlResult = RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader;

export type DatabaseConstructor = {
  new<S extends Record<string, Schema>>(options: DatabaseOptions, tables: S): Database<S>;
};
export type Database<S extends Record<string, Schema> = {}> = {
  [K in keyof S]: Table<S[K]>
} & DatabaseClass;
export const Database = DatabaseClass as any as DatabaseConstructor;

export type DbTableValue<D extends Database, T extends { [K in keyof D]: D[K] extends Table<any> ? K : never }[keyof D]> = TableValue<D[T]>;
export type DbTablePartial<D extends Database, T extends { [K in keyof D]: D[K] extends Table<any> ? K : never }[keyof D]> = TablePartial<D[T]>;
