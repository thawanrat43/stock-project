
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

const ALLOWED_ACTIONS = [
  'Inbound',
  'Adjustment',
  'Verified',
  'Discrepancy',
];

// POST /api/stock/adjust
router.post('/adjust', async (req, res) => {
  const { productId, newQuantity, action, note } = req.body;

  const parsedProductId = Number(productId);
  const parsedQuantity = Number(newQuantity);

  if (
    !Number.isSafeInteger(parsedProductId) ||
    parsedProductId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'รหัสสินค้าไม่ถูกต้อง',
    });
  }

  if (
    !Number.isFinite(parsedQuantity) ||
    parsedQuantity < 0 ||
    !['Inbound', 'Adjustment', 'Verified', 'Discrepancy'].includes(action)
  ) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลปรับยอดไม่ถูกต้อง',
    });
  }

  const client = await pool.connect();

  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;
    await client.query(
    'SELECT pg_advisory_xact_lock($1::bigint)',
    [parsedProductId]
    );
    // ล็อกแถวสต็อกเพื่อป้องกันการปรับยอดพร้อมกัน
    const balanceResult = await client.query(
      `
        SELECT
          sb.id,
          sb.product_id,
          sb.location_id,
          sb.quantity,
          p.sku,
          p.unit
        FROM stock_balances sb
        JOIN products p
          ON p.id = sb.product_id
        WHERE sb.product_id = $1
        ORDER BY sb.id
        FOR UPDATE OF sb
      `,
      [parsedProductId]
    );

    if (balanceResult.rowCount === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลสต็อกสินค้า',
      });
    }

    if (balanceResult.rowCount > 1) {
      await client.query('ROLLBACK');
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: 'สินค้านี้มีหลายตำแหน่งจัดเก็บ กรุณาเลือก Bin ก่อนปรับยอด',
      });
    }

    const balance = balanceResult.rows[0];

    const currentQuantity = Number(balance.quantity);
    const delta = parsedQuantity - currentQuantity;

    // ปรับยอดคงเหลือ
    const updateResult = await client.query(
      `
        UPDATE stock_balances
        SET
          quantity = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING quantity
      `,
      [parsedQuantity, balance.id]
    );

    // บันทึกประวัติการเคลื่อนไหว
    const movementResult = await client.query(
      `
        INSERT INTO stock_movements (
          product_id,
          location_id,
          user_id,
          action,
          delta,
          resulting_qty,
          note
        )
        VALUES ($1, $2, NULL, $3, $4, $5, $6)
        RETURNING id, created_at
      `,
      [
        parsedProductId,
        balance.location_id,
        action,
        delta,
        parsedQuantity,
        note || null,
      ]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.json({
      success: true,
      message: 'บันทึกสต็อกเรียบร้อยแล้ว',
      data: {
        productId: parsedProductId,
        sku: balance.sku,
        locationId: balance.location_id,
        previousQuantity: currentQuantity,
        quantity: Number(updateResult.rows[0].quantity),
        delta,
        action,
        note: note || '',
        unit: balance.unit,
        movementId: movementResult.rows[0].id,
        createdAt: movementResult.rows[0].created_at,
      },
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }

    console.error('Adjust stock error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกการปรับยอดสต็อกได้',
    });
  } finally {
    client.release();
  }
});


// POST /api/stock/transfer
// ย้ายสินค้าทั้งหมดจาก Bin ต้นทางไปยัง Bin ปลายทาง
router.post('/transfer', async (req, res) => {
  const {
    productId,
    sourceLocationId,
    destinationZone,
    destinationBin,
    quantity,
    note,
  } = req.body;

  const parsedProductId = Number(productId);
  const sourceId = Number(sourceLocationId);
  const transferQty = Number(quantity);
  const zone = String(destinationZone || '').trim();
  const bin = String(destinationBin || '').trim().toUpperCase();

  if (
    !Number.isSafeInteger(parsedProductId) ||
    parsedProductId <= 0 ||
    !Number.isSafeInteger(sourceId) ||
    sourceId <= 0 ||
    !zone ||
    !bin
  ) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลสินค้าและตำแหน่งจัดเก็บไม่ถูกต้อง',
    });
  }

  if (
    !Number.isFinite(transferQty) ||
    transferQty <= 0 ||
    Math.round(transferQty * 100) !== transferQty * 100
  ) {
    return res.status(400).json({
      success: false,
      message: 'จำนวนสินค้าที่ต้องการย้ายไม่ถูกต้อง',
    });
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // ล็อก SKU เดียวกัน ป้องกันการปรับยอดและย้ายพร้อมกัน
    await client.query(
      'SELECT pg_advisory_xact_lock($1::bigint)',
      [parsedProductId]
    );

    // ตรวจสอบสินค้า
    const productResult = await client.query(
      `
        SELECT id, sku, name_th, unit
        FROM products
        WHERE id = $1
      `,
      [parsedProductId]
    );

    if (productResult.rowCount === 0) {
      throw Object.assign(new Error('ไม่พบสินค้า'), {
        statusCode: 404,
      });
    }

    const product = productResult.rows[0];

    // ค้นหาตำแหน่งปลายทางจาก Zone และ Bin
    const destinationResult = await client.query(
      `
        SELECT id, zone, bin
        FROM warehouse_locations
        WHERE zone = $1
          AND UPPER(bin) = $2
        FOR SHARE
      `,
      [zone, bin]
    );

    if (destinationResult.rowCount === 0) {
      throw Object.assign(
        new Error('ไม่พบตำแหน่งปลายทางในระบบ กรุณาตรวจสอบ Zone และ Bin'),
        { statusCode: 404 }
      );
    }

    const destination = destinationResult.rows[0];
    const destinationId = Number(destination.id);

    if (sourceId === destinationId) {
      throw Object.assign(
        new Error('ตำแหน่งต้นทางและปลายทางเป็นตำแหน่งเดียวกัน'),
        { statusCode: 400 }
      );
    }

    // ล็อกยอดสินค้า
    const balancesResult = await client.query(
      `
        SELECT id, location_id, quantity
        FROM stock_balances
        WHERE product_id = $1
        ORDER BY id
        FOR UPDATE
      `,
      [parsedProductId]
    );

    const sourceBalance = balancesResult.rows.find(
      (row) => Number(row.location_id) === sourceId
    );

    if (!sourceBalance) {
      throw Object.assign(
        new Error('ไม่พบยอดสินค้าในตำแหน่งต้นทาง'),
        { statusCode: 404 }
      );
    }

    const sourceBefore = Number(sourceBalance.quantity);

    // ตรวจสอบจำนวนกับยอดจริงในฐานข้อมูล
    if (transferQty !== sourceBefore) {
      throw Object.assign(
        new Error(
          `ยอดสินค้าเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่ ยอดปัจจุบันคือ ${sourceBefore}`
        ),
        { statusCode: 409 }
      );
    }

    const sourceAfter = 0;

    // อ่านยอดปลายทาง
    const destinationBalance = balancesResult.rows.find(
      (row) => Number(row.location_id) === destinationId
    );

    const destinationBefore = destinationBalance
      ? Number(destinationBalance.quantity)
      : 0;

    const destinationAfter = destinationBefore + transferQty;

    // ตัดยอดต้นทาง
    await client.query(
      `
        UPDATE stock_balances
        SET quantity = 0,
            updated_at = NOW()
        WHERE id = $1
      `,
      [sourceBalance.id]
    );

    // เพิ่มยอดปลายทาง
    await client.query(
      `
        INSERT INTO stock_balances (
          product_id,
          location_id,
          quantity,
          updated_at
        )
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET
          quantity = stock_balances.quantity + EXCLUDED.quantity,
          updated_at = NOW()
      `,
      [parsedProductId, destinationId, transferQty]
    );

    // บันทึกประวัติฝั่งต้นทาง
    await client.query(
      `
        INSERT INTO stock_movements (
          product_id,
          location_id,
          user_id,
          action,
          delta,
          resulting_qty,
          note
        )
        VALUES ($1, $2, NULL, 'Transfer', $3, $4, $5)
      `,
      [
        parsedProductId,
        sourceId,
        -transferQty,
        sourceAfter,
        note || `ย้ายสินค้าไปยัง ${destination.zone} · ${destination.bin}`,
      ]
    );

    // บันทึกประวัติฝั่งปลายทาง
    const movementResult = await client.query(
      `
        INSERT INTO stock_movements (
          product_id,
          location_id,
          user_id,
          action,
          delta,
          resulting_qty,
          note
        )
        VALUES ($1, $2, NULL, 'Transfer', $3, $4, $5)
        RETURNING id, created_at
      `,
      [
        parsedProductId,
        destinationId,
        transferQty,
        destinationAfter,
        note || `รับย้ายสินค้าจาก Location ID ${sourceId}`,
      ]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.json({
      success: true,
      message: 'ย้ายตำแหน่งสินค้าเรียบร้อยแล้ว',
      data: {
        productId: parsedProductId,
        sku: product.sku,
        quantity: transferQty,
        source: {
          locationId: sourceId,
          quantity: sourceAfter,
        },
        destination: {
          locationId: destinationId,
          zone: destination.zone,
          bin: destination.bin,
          quantity: destinationAfter,
        },
        movementId: movementResult.rows[0].id,
        createdAt: movementResult.rows[0].created_at,
      },
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }

    console.error('Transfer stock error:', error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'ไม่สามารถย้ายตำแหน่งสินค้าได้',
    });
  } finally {
    client.release();
  }
});


export default router;
