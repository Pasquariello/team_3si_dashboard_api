// const connection = require('../config/databricks');

// export async function queryData(sql: string): Promise<any[]> {
//   try {
//     const result = await connection.execute({ sqlText: sql });
//     const rows = await result.fetchAll();
//     return rows;
//   } catch (error: any) {
//     console.error('Error querying Databricks:', error.message);
//     throw error;
//   }
// }

import { connectToDatabricks } from "../config/databricks.js";
import { ExecuteStatementOptions } from "@databricks/sql/dist/contracts/IDBSQLSession.js";

export async function queryData(text: string, namedParameters?: ExecuteStatementOptions["namedParameters"] ): Promise<any[]> {

  const client = await connectToDatabricks();
  const session = await client.openSession();
  const operation = await session.executeStatement(text,  {namedParameters} );
  const result = await operation.fetchAll();

  await operation.close();
  await session.close();
  await client.close();

  return result;
}
