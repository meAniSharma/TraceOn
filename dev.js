/**
 * Single-command dev launcher for TraceOn:
 * Starts the Express backend on http://localhost:3001 and Vite on http://localhost:5173
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting TraceOn Full Stack (Backend + Frontend)...');

// 1. Start backend server
const server = spawn(
  process.execPath,
  ['--experimental-sqlite', path.join(__dirname, 'server', 'index.js')],
  { stdio: 'inherit', env: { ...process.env, PORT: '3001' } }
);

// 2. Start Vite dev server
const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteBin], {
  stdio: 'inherit',
  env: process.env,
});

function cleanup() {
  server.kill();
  vite.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
