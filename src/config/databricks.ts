// const { connect } = require('@databricks/sql');

// const connection = connect({
//   serverHostname: process.env.DATABRICKS_HOST,
//   httpPath: process.env.DATABRICKS_HTTP_PATH,
//   accessToken: process.env.PAT_TOKEN,
// });

// module.exports = connection;

import { DBSQLClient } from "@databricks/sql";

import { env } from "../env.js";

const client = new DBSQLClient();

export async function connectToDatabricks() {
  // console.log({
  //   host: process.env.DATABRICKS_HOST || "",
  //   path: process.env.DATABRICKS_HTTP_PATH || "",
  //   token: process.env.PAT_TOKEN || "",
  // });
  await client.connect({
    host: env.DATABRICKS_HOST || "",
    path: env.DATABRICKS_HTTP_PATH || "",
    token: env.PAT_TOKEN || "",
  });

  return client;
}
