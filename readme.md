# no-mysql

Mysql in a nosql fashion, with very strong TypeScript typings.

```ts
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

db.people.insert({
  id: 231,
  name: 'hello',
  // born: new Date(), // optional
})
```

We wrote this one day then forgot to add half the feature or write docs, so the above example is
all you get until we update it again to add more features, fix bugs. Not all Mysql Types are yet
supported.
