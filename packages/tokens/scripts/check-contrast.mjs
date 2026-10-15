import { runContrastCheck } from './lib/check.mjs';

const failures = await runContrastCheck();
if (failures.length > 0) {
  console.error(`\nWCAG AA contrast check failed: ${failures.length} pair(s) below threshold.`);
  process.exit(1);
}
console.log('\nWCAG AA contrast check passed.');
