import express from "express";

import { env } from "../env.js";

const router = express.Router();

type Databricks = string[];

const workspaceUrl = env.WORKSPACE_URL;
const patToken = env.PAT_TOKEN;
const warehouseId = env.WAREHOUSE_ID;

async function getData() {
  const sqlStatement = `
    select * from cusp_audit.demo.risk_scores limit 10
  `;

  const fetchResult = await fetch(`${workspaceUrl}/api/2.0/sql/statements`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${patToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      statement: sqlStatement,
      warehouse_id: warehouseId,
    }),
  });

  if (!fetchResult?.ok) {
    throw new Error(`HTTP error, Status: ${fetchResult.status}`);
  }

  const data = await fetchResult.json();
  console.log("POST successful, status:", fetchResult.status);

  return data;
}

router.get<object, Databricks>("/", (req, res) => {
  res.json(["data", "from", "azure"]);
});

router.post("/live", async (req, res) => {
  try {
    // const requestData = req.body;
    const result = await getData();
    res.status(200).json({ success: true, data: result });
  }
  catch (error: any) {
    console.error("Error processing POST /live:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;


    // Children Billed Over Capacity

    // Children Placed Over Capacity

    // Distance Traveled

    // Providers With the Same Address