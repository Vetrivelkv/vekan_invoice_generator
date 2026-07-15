import rethinkdbdash from 'rethinkdbdash';

export const databaseName = process.env.RETHINKDB_DB || 'vekan';

const servers = (process.env.RETHINKDB_SERVERS || '127.0.0.1:28015')
  .split(',')
  .map((server) => {
    const [host, port = '28015'] = server.trim().split(':');
    return { host, port: Number(port) };
  });

const options = {
  servers,
  db: databaseName,
  silent: true,
  timeout: Number(process.env.RETHINKDB_TIMEOUT) || 20,
};

if (process.env.RETHINKDB_USER) options.user = process.env.RETHINKDB_USER;
if (process.env.RETHINKDB_PASSWORD) options.password = process.env.RETHINKDB_PASSWORD;

export const r = rethinkdbdash(options);

export async function closeDatabase() {
  await r.getPoolMaster().drain();
}
