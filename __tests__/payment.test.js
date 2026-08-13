const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSplit, toBaseUnits } = require('../dist/services/payment.service.js');

test('FLUX amounts use the verified six-decimal mint precision', () => {
  assert.equal(toBaseUnits(5), 5_000_000n);
  assert.equal(toBaseUnits(0.000001), 1n);
});

test('paid checkout splits exactly 95/5 without losing base units', () => {
  const total = toBaseUnits(5);
  const { sellerAmount, feeAmount } = calculateSplit(total);
  assert.equal(sellerAmount, 4_750_000n);
  assert.equal(feeAmount, 250_000n);
  assert.equal(sellerAmount + feeAmount, total);
});

test('invalid FLUX prices fail closed', () => {
  assert.throws(() => toBaseUnits(-1), /Invalid FLUX price/);
  assert.throws(() => toBaseUnits(Number.NaN), /Invalid FLUX price/);
  assert.throws(() => toBaseUnits(0.0000015), /at most 6 decimals/);
});
