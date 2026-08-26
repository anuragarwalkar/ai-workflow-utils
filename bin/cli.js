#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.dirname(__dirname);

// Prefer built CLI if available, otherwise source CLI
const distCli = path.join(packageDir, 'dist', 'apps', 'cli', 'cli.js');
const srcCli = path.join(packageDir, 'apps', 'cli', 'src', 'cli.js');

if (fs.existsSync(distCli)) {
  await import(distCli);
} else if (fs.existsSync(srcCli)) {
  await import(srcCli);
} else {
  console.error('❌ Could not locate CLI entry point. Please build the project with "npm run build".');
  process.exit(1);
}
