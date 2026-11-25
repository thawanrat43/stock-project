
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM products
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get products error:', error.message);

    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลสินค้าได้',
    });
  }
});

export default router;
