
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './config/db.js';
import 'dotenv/config';
import productsRouter from './routes/products.js';
import stockRouter from './routes/stock.js';
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
}));

app.use(express.json());
app.use('/api/stock', stockRouter);
app.use('/api/products', productsRouter);
// ตรวจสอบ Backend
// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Apex Stock Backend is running',
//   });
// });

// // ตรวจสอบ PostgreSQL
// app.get('/api/health/db', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT
//         current_database() AS database,
//         current_user AS username,
//         NOW() AS server_time
//     `);

//     res.json({
//       success: true,
//       message: 'PostgreSQL connected successfully',
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error('Database error:', error.message);

//     res.status(500).json({
//       success: false,
//       message: 'Database connection failed',
//     });
//   }
// });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(
    `Apex Stock API running at http://localhost:${PORT}`
  );
});
