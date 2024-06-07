const { db } = require("@vercel/postgres");

const createVeevaTable = async (client) => {
  await client.sql`
CREATE TABLE IF NOT EXISTS veevaConfig (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vaultId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  dns VARCHAR(600) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  createdBy VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
`;
};

const main = async () => {
  const client = await db.connect();

  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await createVeevaTable(client);

  await client.end();
};

main();
