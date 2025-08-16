#!/usr/bin/env bash
# Small script to update versions in package.json, src-tauri/tauri.conf.json and src-tauri/Cargo.toml
# Usage: ./scripts/update-version.sh <new-version|major|minor|patch> [--dry-run]

set -euo pipefail

# Validate args
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <new-version|major|minor|patch> [--dry-run]"
  exit 1
fi

ARG=$1

# optional second arg: --dry-run
DRY_RUN=false
if [ "$#" -eq 2 ] && [ "$2" = "--dry-run" ]; then
  DRY_RUN=true
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Compute new version
if [[ "$ARG" =~ ^(major|minor|patch)$ ]]; then
  echo "Incrementing '${ARG}' based on current package.json version"
  NEW_VERSION=$(ROOT_DIR="${ROOT_DIR}" OP="$ARG" node - <<'NODE'
const fs = require('fs');
const root = process.env.ROOT_DIR;
const op = process.env.OP;
const p = root + '/package.json';
const j = JSON.parse(fs.readFileSync(p,'utf8'));
const v = (j.version || '0.0.0');
const full = v.split('-');
const core = full[0];
const suffix = full.slice(1).join('-');
const parts = core.split('.').map(n=>parseInt(n,10)||0);
while(parts.length < 3) parts.push(0);
let [ma,mi,pa] = parts;
if(op === 'major'){ ma++; mi = 0; pa = 0 } else if(op === 'minor'){ mi++; pa = 0 } else { pa++ }
let out = [ma,mi,pa].join('.');
if(suffix) out += '-' + suffix;
console.log(out);
NODE
)
else
  # Validate explicit semver-ish version (simple check)
  if [[ ! "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    echo "Provided version '$ARG' does not look like x.y.z and is not 'major|minor|patch'."
    exit 1
  fi
  NEW_VERSION="$ARG"
fi

echo "New version: ${NEW_VERSION}"

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN: would update the following files with version ${NEW_VERSION}:"
  [ -f "${ROOT_DIR}/package.json" ] && echo "  - ${ROOT_DIR}/package.json"
  [ -f "${ROOT_DIR}/src-tauri/tauri.conf.json" ] && echo "  - ${ROOT_DIR}/src-tauri/tauri.conf.json"
  [ -f "${ROOT_DIR}/src-tauri/Cargo.toml" ] && echo "  - ${ROOT_DIR}/src-tauri/Cargo.toml"
  echo "Run without --dry-run to apply changes."
  exit 0
fi

echo "Updating files to ${NEW_VERSION}"

echo "- package.json"
ROOT_DIR="${ROOT_DIR}" NEW_VERSION="${NEW_VERSION}" node <<'NODE'
const fs = require('fs');
const p = process.env.ROOT_DIR + '/package.json';
const j = JSON.parse(fs.readFileSync(p,'utf8'));
j.version = process.env.NEW_VERSION;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('updated', p);
NODE

if [ -f "${ROOT_DIR}/src-tauri/tauri.conf.json" ]; then
  echo "- src-tauri/tauri.conf.json"
  ROOT_DIR="${ROOT_DIR}" NEW_VERSION="${NEW_VERSION}" node <<'NODE'
const fs = require('fs');
const p = process.env.ROOT_DIR + '/src-tauri/tauri.conf.json';
const j = JSON.parse(fs.readFileSync(p,'utf8'));
j.version = process.env.NEW_VERSION;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('updated', p);
NODE
fi

if [ -f "${ROOT_DIR}/src-tauri/Cargo.toml" ]; then
  echo "- src-tauri/Cargo.toml"
  # naive toml edit for the top-level version key
  perl -0777 -pe "s/^version\s*=\s*\"[^\"]+\"/version = \"${NEW_VERSION}\"/m" -i "${ROOT_DIR}/src-tauri/Cargo.toml"
  echo "updated src-tauri/Cargo.toml"
fi

echo "Done. Please review changes and commit them."
