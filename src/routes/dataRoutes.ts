// const express = require('express');
// const router = express.Router();
// const { queryData } = require('../services/queryService');

// router.get('/', async (req, res) => {
//   try {
//     const data = await queryData('select * from cusp_audit.demo.risk_scores limit 10');
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;


import { Router, Request, Response } from 'express';
import { queryData } from '../services/queryService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await queryData('select * from cusp_audit.demo limit 10');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router

