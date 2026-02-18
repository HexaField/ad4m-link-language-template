#!/usr/bin/env node
/**
 * Patch @coasys/ad4m-test for use with the bootstrap seed approach.
 * 
 * The published npm package (@coasys/ad4m-test@0.11.1) ships TypeScript
 * source only (no compiled build/ directory) and has various issues.
 * 
 * This script:
 * 1. Clones the fixed test-runner source from coasys/ad4m fix/ad4m-test-runner
 * 2. Copies fixed source over the installed package
 * 3. Compiles TypeScript to produce build/cli.js
 * 4. Downloads bootstrapSeed.json from coasys/ad4m (contains language-language
 *    bundle inline as ESM, plus hashes for system languages that are fetched
 *    at runtime from bootstrap-store-gateway)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIX_BRANCH = 'fix/ad4m-test-use-bootstrap-seed';
const AD4M_REPO = 'https://github.com/coasys/ad4m.git';
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

function cloneFixedSource() {
  const tmpDir = '/tmp/ad4m-test-fix-src';
  if (fs.existsSync(tmpDir)) {
    execSync(`rm -rf ${tmpDir}`);
  }
  console.log(`Cloning fix branch from ${AD4M_REPO}...`);
  execSync(`git clone --depth 1 --branch ${FIX_BRANCH} --filter=blob:none --sparse ${AD4M_REPO} ${tmpDir}`, { stdio: 'inherit' });
  execSync(`cd ${tmpDir} && git sparse-checkout set test-runner`, { stdio: 'inherit' });
  return path.join(tmpDir, 'test-runner');
}

function copyFixedSource(srcDir, destDir) {
  const srcSrcDir = path.join(srcDir, 'src');
  const destSrcDir = path.join(destDir, 'src');
  
  if (fs.existsSync(srcSrcDir)) {
    for (const file of fs.readdirSync(srcSrcDir)) {
      const srcFile = path.join(srcSrcDir, file);
      const destFile = path.join(destSrcDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    const srcHelpers = path.join(srcSrcDir, 'helpers');
    const destHelpers = path.join(destSrcDir, 'helpers');
    if (fs.existsSync(srcHelpers)) {
      for (const file of fs.readdirSync(srcHelpers)) {
        const srcFile = path.join(srcHelpers, file);
        const destFile = path.join(destHelpers, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
    }
  }
  
  const pkgSrc = path.join(srcDir, 'package.json');
  if (fs.existsSync(pkgSrc)) {
    fs.copyFileSync(pkgSrc, path.join(destDir, 'package.json'));
  }
  
  console.log(`  Copied fixed source to ${destDir}`);
}

// Main
console.log('Patching @coasys/ad4m-test with fixed source + bootstrap seed...\n');

const dirs = findAd4mTestDirs();
if (dirs.length === 0) {
  console.error('No @coasys/ad4m-test installations found!');
  process.exit(1);
}

// Clone fixed source once
const fixedSrcDir = cloneFixedSource();

// Download bootstrap seed once
const seedTmp = '/tmp/bootstrapSeed.json';
console.log(`\nDownloading bootstrap seed from ${BOOTSTRAP_SEED_URL}...`);
execSync(`curl -sL -o "${seedTmp}" "${BOOTSTRAP_SEED_URL}"`, { stdio: 'inherit' });
const seed = JSON.parse(fs.readFileSync(seedTmp, 'utf-8'));
console.log(`  Bootstrap seed downloaded (${Object.keys(seed).length} keys)\n`);

for (const dir of dirs) {
  console.log(`\nProcessing: ${dir}`);
  
  // Step 1: Copy fixed source files
  copyFixedSource(fixedSrcDir, dir);
  
  // Step 2: Compile TypeScript
  console.log(`  Compiling TypeScript...`);
  execSync(`cd "${dir}" && npx tsc --noImplicitAny false`, { stdio: 'inherit' });
  
  // Step 3: Copy bootstrap seed (replaces language download + CJS→ESM conversion)
  fs.copyFileSync(seedTmp, path.join(dir, 'bootstrapSeed.json'));
  console.log(`  Copied bootstrapSeed.json`);
}

console.log('\nDone!');
