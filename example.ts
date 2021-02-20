import { Database, DbTableValue, TableValue } from './src'

const db = new Database(
  {
    database: 'db',
    host: 'club',
    user: 'dave',
  },
  {
    people: {
      id: 'primary int',
      name: ['varChar', 100],
      born: 'optional date',
    },
    numbers: {
      id: 'primary int',
      coolness: 'int',
    }
  }
)

type PeopleEntry = DbTableValue<typeof db, 'people'>;
type NumbersEntry = DbTableValue<typeof db, 'numbers'>;
