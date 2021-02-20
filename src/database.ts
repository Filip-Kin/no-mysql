import { createConnection, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import Connection from 'mysql2/typings/mysql/lib/Connection';
import Query from 'mysql2/typings/mysql/lib/protocol/sequences/Query';
import NodeCache from 'node-cache';

import { ConnectionSettings, DatabaseSchmea, GetPrimaryKey, MySQLDeserializationMap, MySQLSerializationMap, ObjFromSchema, PartialObjFromSchema, SchemaTypeToValue } from "./types";

export class Database {

  private cache: NodeCache | null;
  private connectionSettings: ConnectionSettings;
  private connection: Connection

  constructor(connectionSettings: ConnectionSettings, tables: DatabaseSchmea) {
    this.connectionSettings = connectionSettings;
    this.connectionSettings.cacheTTL = connectionSettings.cacheTTL || 300
    this.cache = (this.connectionSettings.cacheTTL > -1) ? new NodeCache({ stdTTL: connectionSettings.cacheTTL }) : null;

    this.connection = createConnection(this.connectionSettings);
  }

  // Exposes query function for advanced used but turns it into a Promise instead of callback
  public _query(sql: string, placeholderValues: any[]): Promise<Query.QueryError | RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader> {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, placeholderValues, (err, results) => {
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
}
