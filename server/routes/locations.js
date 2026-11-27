
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/locations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        zone,
        bin,
        description
      FROM warehouse_locations
      ORDER BY zone ASC, bin ASC
    `);

    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get locations error:', error.message);

    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงตำแหน่งจัดเก็บได้',
    });
  }
});

export default router;
