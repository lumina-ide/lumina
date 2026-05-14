#!/usr/bin/env node
/**
 * Lumina - Auto version bump
 * Increments luminaRelease in product.json before each build
 * Usage: node scripts/bump-version.js [--minor] [--major]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const productPath = resolve(__dirname, '../product.json');

const product = JSON.parse(readFileSync(productPath, 'utf8'));

const args = process.argv.slice(2);
const bumpMinor = args.includes('--minor');
const bumpMajor = args.includes('--major');

const [major, minor, patch] = (product.luminaVersion || '0.1.0').split('.').map(Number);
const release = parseInt(product.luminaRelease || '0001', 10);

let newMajor = major, newMinor = minor, newPatch = patch;
let newRelease = release + 1;

if (bumpMajor) {
    newMajor = major + 1; newMinor = 0; newPatch = 0; newRelease = 1;
} else if (bumpMinor) {
    newMinor = minor + 1; newPatch = 0; newRelease = 1;
} else {
    newPatch = patch + 1;
}

const newVersion = ${"$"}{newMajor}.{newMinor}.{newPatch};
const newReleaseStr = String(newRelease).padStart(4, '0');

product.luminaVersion = newVersion;
product.luminaRelease = newReleaseStr;

writeFileSync(productPath, JSON.stringify(product, null, '\t'), 'utf8');

console.log('Lumina version bumped:');
console.log('  luminaVersion: ' + major + '.' + minor + '.' + patch + ' -> ' + newVersion);
console.log('  luminaRelease: ' + String(release).padStart(4,'0') + ' -> ' + newReleaseStr);
