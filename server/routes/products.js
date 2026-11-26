
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/products
// ดึงข้อมูลสินค้า พร้อมยอดคงเหลือและตำแหน่งจัดเก็บ
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.sku,
        p.barcode,
        p.name,
        p.name_th,
        p.category,
        p.batch,
        p.supplier,
        p.unit,
        p.min_threshold,
        p.last_verified,
        p.verified_by,
        p.created_at,
        COALESCE(SUM(sb.quantity), 0) AS quantity,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'locationId', wl.id,
              'zone', wl.zone,
              'bin', wl.bin,
              'quantity', sb.quantity
            )
          ) FILTER (WHERE wl.id IS NOT NULL),
          '[]'
        ) AS locations
      FROM products p
      LEFT JOIN stock_balances sb
        ON sb.product_id = p.id
      LEFT JOIN warehouse_locations wl
        ON wl.id = sb.location_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    const data = result.rows.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      minThreshold: Number(item.min_threshold),
      nameTh: item.name_th,
      lastVerified: item.last_verified,
      verifiedBy: item.verified_by,
      zone: item.locations[0]?.zone || '',
      bin: item.locations[0]?.bin || '',
    }));

    res.json({
      success: true,
      count: data.length,
      data,
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
