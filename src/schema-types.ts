// MYSQL CONFIG TYPES
export interface SchemaTypeMap {
  int: number
  double: number
  boolean: boolean
  date: Date
  dateTime: Date
  timeStamp: number
  time: Date
  text: string
  mediumText: string
  longText: string
}
export interface SchemaTypeArrayMap {
  varChar: { type: string, args: [ maxLength: number ] },
  char: { type: string, args: [ length: number ] },
}
export type PrimaryKeyType = 'int';

// DARK MAGIC WITH TYPES
export type Flat<X> = X extends any ? X : never;
export type FPick<T, K extends keyof T> = T extends any ? {
  [P in K]: T[P];
} : never;
export type FPartial<T> = T extends any ? {
  [P in keyof T]?: T[P];
} : never;
export type Schema = Record<string, SchemaType>;
export type SchemaType = keyof SchemaTypeMap
  | { [K in keyof SchemaTypeArrayMap]: [type: K, ...args: SchemaTypeArrayMap[K]['args']]}[keyof SchemaTypeArrayMap]
  | { [K in keyof SchemaTypeArrayMap]: [type: `optional ${K}`, ...args: SchemaTypeArrayMap[K]['args']]}[keyof SchemaTypeArrayMap]
  | `optional ${keyof SchemaTypeMap}`
  | `primary ${PrimaryKeyType}`
  | JSONData<any>;
// JSONData is a fake data structure used only for type checking,
// the actual form of json data schema is just the string 'json'
export type JSONData<Data> = { JSONData_TYPE_DO_NOT_USE_DIRECTLY: Data };
export type UndefinedPropertyNames<X> = { [K in keyof X]: Extract<X[K], undefined> extends never ? never : K }[keyof X];
export type DefinedPropertyNames<X> = { [K in keyof X]: Extract<X[K], undefined> extends never ? K : never }[keyof X];
export type UndefinedToOptional<X> = Flat< 
  FPick<X, DefinedPropertyNames<X>> & FPartial<FPick<X, UndefinedPropertyNames<X>>>
>;
export type SchemaValue<S extends Schema> = Flat<UndefinedToOptional<{
  [K in keyof S]: SchemaTypeToValue<S[K]>
}>>;
export type SchemaPartial<S extends Schema> = Flat<UndefinedToOptional<{
  [K in keyof S]: K extends GetPrimaryKey<S> ? SchemaTypeToValue<S[K]> : (SchemaTypeToValue<S[K]> | undefined)
}>>;
export type SchemaTypeToValue<K extends any>
  = K extends keyof SchemaTypeMap ? SchemaTypeMap[K]
  : K extends JSONData<infer Data> ? SchemaTypeToValue<Data>
  : K extends `optional ${infer Type}` ? SchemaTypeToValue<Type> | undefined
  : K extends `primary ${infer Type}` ? SchemaTypeToValue<Type>
  : K extends [infer Type, ...infer Args] ? 
    Type extends `optional ${infer Type2}`
      ? Type2 extends keyof SchemaTypeArrayMap ? SchemaTypeArrayMap[Type2]['type'] | undefined
      : K
    : Type extends keyof SchemaTypeArrayMap ? SchemaTypeArrayMap[Type]['type']
    : K
  : K;
export type GetPrimaryKey<S extends Schema> = { [K in keyof S]: S[K] extends `primary ${infer X}` ? K : never }[keyof S];
export type MySQLDeserializer<V> = (value: any) => V;
export type MySQLDeserializationMap
  = { json: MySQLDeserializer<any> }
  & { [K in keyof SchemaTypeMap]: MySQLDeserializer<SchemaTypeMap[K]> }
  & { [K in keyof SchemaTypeArrayMap]: MySQLDeserializer<SchemaTypeArrayMap[K]['type']> }
export type MySQLSerializer<V> = (value: V) => any;
export type MySQLSerializationMap
  = { json: MySQLSerializer<any> }
  & { [K in keyof SchemaTypeMap]: MySQLSerializer<SchemaTypeMap[K]> }
  & { [K in keyof SchemaTypeArrayMap]: MySQLSerializer<SchemaTypeArrayMap[K]['type']> }
export type InternalParsedSchema = Record<string, {
  type: keyof SchemaTypeMap | keyof SchemaTypeArrayMap | 'json',
  args: any[],
  primary?: boolean,
  optional?: boolean
}>;
