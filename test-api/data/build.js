const assert = require('assert')
const { env } = process;

if (!env.DB || env.DB === 'PG')
{
  assert(process.env.PG_URL, 'Environment variable PG_URL must be defined, e.g. "postgres://user:pass@localhost/"')
}

if (!env.DB || env.DB === 'MYSQL')
{
  assert(process.env.MYSQL_URL, 'Environment variable MYSQL_URL must be defined, e.g. "mysql://user:pass@localhost/"')
}

;(async () => {
  //console.log('building oracle')
  //await require('./setup/test1')('oracle')
  //await require('./setup/test2')('oracle')

  // only build if MSSQL_URL is available
  if ((!env.DB || env.DB === 'MSSQL') && env.MSSQL_URL)
  {
    console.log('building mssql')
    await require('./setup/test1')('mssql');
    await require('./setup/test2')('mssql');
  }

  if (!env.DB || env.DB === 'SQLITE')
  {
    console.log('building sqlite3')
    await require('./setup/test1')('sqlite3');
    await require('./setup/demo')('sqlite3');
  }

  if (!env.DB || env.DB === 'MYSQL')
  {
    console.log('building mysql')
    await require('./setup/test1')('mysql')
    await require('./setup/test2')('mysql')
  }
  if (!env.DB || env.DB === 'PG')
  {
    console.log('building postgres')
    await require('./setup/test1')('pg')
    await require('./setup/test2')('pg')
    await require('./setup/demo')('pg')
  }
})()
.catch(err => {
  console.error(err)
  process.exit(1)
})

