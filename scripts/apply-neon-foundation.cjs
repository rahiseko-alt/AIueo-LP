const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  await client.query(fs.readFileSync('drizzle/0000_neon_foundation.sql', 'utf8'));
  const { rows } = await client.query("select count(*)::int as table_count from information_schema.tables where table_schema = 'public'");
  console.log(JSON.stringify(rows[0]));
  await client.end();
}

main().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exit(1);
});
