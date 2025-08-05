
import { Router, Request, Response } from 'express';
import { queryData } from '../services/queryService';

// @desc    Update new bootcamp
// @route   put /api/v1/bootcamps/:id
// @access  Private
export const updateProviderDataInsights = async (req: Request, res: Response) => {
    const row_id = req.params.row_id;
    const body = req.body;
    const { provider_licensing_id, is_flagged, comment} =  req?.body;

//  id INT,
//     row_id  STRING,
//     provider_licensing_id INT,
//     is_flagged BOOLEAN,
//     comment STRING,
//     created_at TIMESTAMP

    const sqlQuery = `
        MERGE INTO cusp_audit.demo.provider_data_insights target
        USING (
            SELECT
                ${row_id} AS id,
                ${provider_licensing_id} AS provider_licensing_id,
                ${is_flagged} AS is_flagged,
                '${comment}' AS comment
        ) source
        ON target.id = source.id
        WHEN MATCHED THEN
        UPDATE SET
            target.provider_licensing_id = source.provider_licensing_id,
            target.is_flagged = source.is_flagged,
            target.comment = source.comment
        WHEN NOT MATCHED THEN
        INSERT (id, provider_licensing_id, is_flagged, comment)
        VALUES (source.id, source.provider_licensing_id, source.is_flagged, source.comment)
    `;

//   'select * from cusp_audit.demo limit 10'
   try { 
        const data = await queryData(sqlQuery);
        console.log('DATA', data);
        res.json(data);
    } catch (err: any) {
        console.log('err =======', err);
        res.status(500).json({ error: err.message });
    }

//   const response = await fetch(`${DATABRICKS_INSTANCE}/api/2.0/sql/statements`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       statement: sqlQuery,
//       warehouse_id: SQL_ENDPOINT_ID,
//     }),
//   });

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(`Error running upsert: ${data.message || JSON.stringify(data)}`);
//   }

//   console.log('Upsert query submitted:', data);

    // console.log('HIT UPDATE', row_id);
    // console.log('body ===', body);

    
    // res.json({message: 'Hit update', id: row_id, data: body});

    // const bootcamp = await Bootcamp.findByIdAndUpdate(id, body, {
    //     new: true,
    //     runValidators: true
    // });

    // if (!bootcamp) {
    //     // use return here to make sure that in this 
    //     // if statement the function stops
    //     return next(new ErrorResponse(`Bootcamp not found with id of ${id}`, 404));

    // }

    // res.status(200).json({ 
    //     success: true, 
    //     data: bootcamp,
    // });

};
