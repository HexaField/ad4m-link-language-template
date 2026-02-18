#!/usr/bin/env node
/**
 * Patch @coasys/ad4m-test to use the bootstrap seed from coasys/ad4m.
 * 
 * The bootstrap seed contains:
 * - The language-language bundle inline (already ESM)
 * - Hashes for all system languages
 * - At runtime, language-language fetches system languages by hash from
 *   https://bootstrap-store-gateway.perspect3vism.workers.dev
 * 
 * This replaces the old approach of cloning a fix branch, downloading
 * language bundles, and converting CJS→ESM manually.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BOOTSTRAP_SEED_URL = 'https://raw.githubusercontent.com/coasys/ad4m/dev/tests/js/bootstrapSeed.json';

function findAd4mTestDirs() {
  const dirs = new Set();
  const base = path.join(process.cwd(), 'node_modules');
  
  const direct = path.join(base, '@coasys', 'ad4m-test');
  if (fs.existsSync(direct)) dirs.add(fs.realpathSync(direct));
  
  const pnpmDir = path.join(base, '.pnpm');
  if (fs.existsSync(pnpmDir)) {
    for (const entry of fs.readdirSync(pnpmDir)) {
      if (entry.startsWith('@coasys+ad4m-test')) {
        const nested = path.join(pnpmDir, entry, 'node_modules', '@coasys', 'ad4m-test');
        if (fs.existsSync(nested)) dirs.add(fs.realpathSync(nested));
      }
    }
  }
  return [...dirs];
}

// Main
console.log('Patching @coasys/ad4m-test with bootstrap seed...\n');

const dirs = findAd4mTestDirs();
if (dirs.length === 0) {
  console.error('No @coasys/ad4m-test installations found!');
  process.exit(1);
}

// Download bootstrap seed once
const seedTmp = '/tmp/bootstrapSeed.json';
console.log(`Downloading bootstrap seed from ${BOOTSTRAP_SEED_URL}...`);
execSync(`curl -sL -o "${seedTmp}" "${BOOTSTRAP_SEED_URL}"`, { stdio: 'inherit' });

// Verify it's valid JSON
const seed = JSON.parse(fs.readFileSync(seedTmp, 'utf-8'));
console.log(`  Bootstrap seed downloaded (${Object.keys(seed).length} keys)\n`);

for (const dir of dirs) {
  const destPath = path.join(dir, 'bootstrapSeed.json');
  fs.copyFileSync(seedTmp, destPath);
  console.log(`  Copied bootstrapSeed.json to ${dir}`);
}

console.log('\nDone!');
