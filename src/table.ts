import { Database } from "./database";
import { GetPrimaryKey, InternalParsedSchema, JSONData, MySQLDeserializationMap, MySQLSerializationMap, SchemaValue, SchemaPartial, Schema, SchemaTypeToValue } from "./schema-types";

// i suggest you use some form of mapping per type, to make the js <-> mysql conversions easier

// mysql value --> javascript value
const mysqlDeserializationMap: MySQLDeserializationMap = {
  // int: (value) => value,
  // double: (value) => value,
  // boolean: (value) => value,
  date: (value) => new Date(value),
  // dateTime: (value) => value,
  // timeStamp: (value) => value,
  // time: (value) => value,
  // text: (value) => value,
  // mediumText: (value) => value,
  // longText: (value) => value,
  // varChar: (value) => value,
  // char: (value) => value,
  json: (value) => JSON.parse(value),
}
// javascript value --> mysql value
const mysqlSerializationMap: MySQLSerializationMap = {
  // int: (value) => value,
  // double: (value) => value,
  // boolean: (value) => value,
  // date: (value) => value,
  // dateTime: (value) => value,
  // timeStamp: (value) => value,
  // time: (value) => value,
  // text: (value) => value,
  // mediumText: (value) => value,
  // longText: (value) => value,
  // varChar: (value) => value,
  // char: (value) => value,
  json: (value) => JSON.stringify(value),
}

export class Table<S extends Schema> {
  static JSON = <Data>() => 'json' as any as JSONData<Data>;

  private name: string;
  private primaryKey!: string;
  private types: InternalParsedSchema;

  constructor(name: string, database: Database<any>, schema: S) {
    this.name = name;
    this.types = {};
    Object.keys(schema).forEach(key => {
      const value = schema[key];
      const obj = {} as InternalParsedSchema[string];

      let type: string;
      if (Array.isArray(value)) {
        type = value[0];
        obj.args = value.slice(1);
      } else {
        type = value.toString();
      }

      const parts = type.split(' ');
      if (parts.length === 1) {
        obj.type = parts[0] as any;
      } else {
        (obj as any)[parts[0]] = true;
        obj.type = parts[1] as any;

        if (obj.primary) {
          this.primaryKey = key;
        }
      }

      this.types[key] = obj;
    });

    if(!this.primaryKey) {
      throw new Error("A Primary Key is required.");
    }
  }

  async get(primaryKey: SchemaTypeToValue<S[GetPrimaryKey<S>]>): Promise<SchemaValue<S>> {
    throw new Error("Method not implemented.");
  }

  async getAll<K extends Exclude<keyof S, GetPrimaryKey<S>>>(key: K, value: SchemaTypeToValue<S[K]>): Promise<SchemaValue<S>[]> {
    throw new Error("Method not implemented.");
  }

  async insert(object: SchemaValue<S>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async update(object: SchemaPartial<S>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async delete(id: GetPrimaryKey<S>): Promise<void> {
    throw new Error("Method not implemented.");
  }

}

export type TableValue<T extends Table<any>> = T extends Table<infer S> ? SchemaValue<S> : never;
export type TablePartial<T extends Table<any>> = T extends Table<infer S> ? SchemaPartial<S> : never;
