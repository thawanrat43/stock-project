
// import dotenv from 'dotenv';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { spawnSync } from 'node:child_process';

// const currentDir = path.dirname(fileURLToPath(import.meta.url));
// const envPath = path.resolve(currentDir, '../.env');

// dotenv.config({ path: envPath, override: true });

// const password = process.env.DB_PASSWORD;

// console.log('Environment loaded:', Boolean(password));
// console.log('Password length:', password?.length ?? 0);

// if (!password) {
//   console.error('DB_PASSWORD is missing');
//   process.exit(1);
// }

// const result = spawnSync(
//   'C:\\Program Files\\PostgreSQL\\19\\bin\\psql.exe',
//   [
//     '-w',
//     '-h', process.env.DB_HOST || '127.0.0.1',
//     '-p', process.env.DB_PORT || '5432',
//     '-U', process.env.DB_USER || 'postgres',
//     '-d', process.env.DB_NAME || 'drr_stock',
//     '-c', 'SELECT current_database(), current_user;'
//   ],
//   {
//     encoding: 'utf8',
//     env: {
//       ...process.env,
//       PGPASSWORD: password,
//     },
//   }
// );

// console.log('Exit code:', result.status);
// console.log(result.stdout);
// console.log(result.stderr);
