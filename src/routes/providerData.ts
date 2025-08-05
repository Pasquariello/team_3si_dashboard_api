import { Router, Request, Response } from 'express';
import { updateProviderDataInsights } from '../controllers/providerData';

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

router.route('/insights/:row_id')
    .put(updateProviderDataInsights)


export default router

