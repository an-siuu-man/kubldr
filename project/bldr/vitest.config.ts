// This file is intentionally minimal.
// The real Vitest configuration lives in vitest.config.mts (an ES module file).
// All npm test scripts use --config vitest.config.mts explicitly.
//
// Background: Next.js 16 projects lack "type": "module" in package.json, so
// .ts config files are loaded as CJS by Node.js — which conflicts with
// ESM-only packages inside Vitest 4.x (e.g. std-env). The .mts extension
// forces ES module loading regardless of the package.json "type" field.
