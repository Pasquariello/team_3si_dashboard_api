// const { connect } = require('@databricks/sql');

// const connection = connect({
//   serverHostname: process.env.DATABRICKS_HOST,
//   httpPath: process.env.DATABRICKS_HTTP_PATH,
//   accessToken: process.env.PAT_TOKEN,
// });

// module.exports = connection;

//  end OLD 
// import { DBSQLClient } from "@databricks/sql";

// import { env } from "../env.js";

// const client = new DBSQLClient();

// export async function connectToDatabricks() {
//   // console.log({
//   //   host: process.env.DATABRICKS_HOST || "",
//   //   path: process.env.DATABRICKS_HTTP_PATH || "",
//   //   token: process.env.PAT_TOKEN || "",
//   // });
//   await client.connect({
//     host: env.DATABRICKS_HOST || "",
//     path: env.DATABRICKS_HTTP_PATH || "",
//     token: env.PAT_TOKEN || "",
//   });

//   return client;
// }
// start new
import { DBSQLClient } from "@databricks/sql";

import { env } from "../env.js";

let client: DBSQLClient | null = null;

export async function getDatabricksClient(): Promise<DBSQLClient> {
  if (!client) {
    client = new DBSQLClient();
    await client.connect({
      host: env.DATABRICKS_HOST!,
      path: env.DATABRICKS_HTTP_PATH!,
      token: env.PAT_TOKEN!,
    });
    console.log("Databricks client connected");
  }
  return client;
}

export function resetClient() {
  client = null
}
