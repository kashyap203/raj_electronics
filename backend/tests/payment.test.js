import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  rupeesToPaise,
  paiseToRupees,
  roundMoney,
  calculatePercentageDiscount,
  calculateFixedDiscount,
} from '../utils/moneyUtils.js';
import { buildSignaturePayload, generatePineLabsSignature } from '../utils/pineLabsSignature.js';
import PineLabsGateway from '../services/payment/PineLabsGateway.js';

describe('moneyUtils', () => {
  it('converts rupees to paise correctly', () => {
    assert.equal(rupeesToPaise(100), 10000);
    assert.equal(rupeesToPaise(1.5), 150);
  });

  it('converts paise to rupees correctly', () => {
    assert.equal(paiseToRupees(10000), 100);
    assert.equal(paiseToRupees(150), 1.5);
  });

  it('avoids floating point errors', () => {
    assert.equal(roundMoney(0.1 + 0.2), 0.3);
  });

  it('calculates percentage discount with max cap', () => {
    assert.equal(calculatePercentageDiscount(10000, 10, 500), 500);
    assert.equal(calculatePercentageDiscount(1000, 10, 500), 100);
  });

  it('calculates fixed discount capped at amount', () => {
    assert.equal(calculateFixedDiscount(500, 1000), 500);
    assert.equal(calculateFixedDiscount(5000, 1000), 1000);
  });
});

describe('Pine Labs UPI UAT simulator amount ranges (paisa)', () => {
  const gateway = new PineLabsGateway();

  const scenarios = [
    { amountPaise: 10000, range: '100-50000', expected: 'SUCCESS' },
    { amountPaise: 50000, range: '100-50000', expected: 'SUCCESS' },
    { amountPaise: 55000, range: '50100-60000', expected: 'PENDING' },
    { amountPaise: 65000, range: '60100-70000', expected: 'FAILED' },
    { amountPaise: 75000, range: '70100-80000', expected: 'FAILED' },
  ];

  for (const { amountPaise, range, expected } of scenarios) {
    it(`amount ${amountPaise} paisa (${range}) maps to ${expected}`, () => {
      let simulatedStatus;
      if (amountPaise >= 100 && amountPaise <= 50000) simulatedStatus = 'PROCESSED';
      else if (amountPaise >= 50100 && amountPaise <= 60000) simulatedStatus = 'PENDING';
      else if (amountPaise >= 60100 && amountPaise <= 70000) simulatedStatus = 'FAILED';
      else if (amountPaise >= 70100 && amountPaise <= 80000) simulatedStatus = 'ERROR';
      else if (amountPaise >= 80000) simulatedStatus = 'TIMEOUT';

      const mapped = gateway.mapPineLabsStatus(simulatedStatus);
      if (expected === 'SUCCESS') assert.equal(mapped, 'SUCCESS');
      if (expected === 'PENDING') assert.equal(mapped, 'PENDING');
      if (expected === 'FAILED') assert.equal(mapped, 'FAILED');
    });
  }
});

describe('pineLabsSignature', () => {
  it('builds lexicographically sorted payload', () => {
    const payload = buildSignaturePayload({ status: 'PROCESSED', order_id: 'abc123' });
    assert.equal(payload, 'order_id=abc123&status=PROCESSED');
  });

  it('generates consistent HMAC signature', () => {
    const secretKey = 'a'.repeat(64);
    const payload = 'order_id=test123&status=PROCESSED';
    const sig1 = generatePineLabsSignature(payload, secretKey);
    const sig2 = generatePineLabsSignature(payload, secretKey);
    assert.equal(sig1, sig2);
    assert.equal(sig1.length, 64);
  });
});

describe('PineLabsGateway status mapping', () => {
  const gateway = new PineLabsGateway();

  it('maps PROCESSED to SUCCESS', () => {
    assert.equal(gateway.mapPineLabsStatus('PROCESSED'), 'SUCCESS');
  });

  it('maps AUTHORIZED to PENDING', () => {
    assert.equal(gateway.mapPineLabsStatus('AUTHORIZED'), 'PENDING');
  });

  it('maps FAILED to FAILED', () => {
    assert.equal(gateway.mapPineLabsStatus('FAILED'), 'FAILED');
  });

  it('maps TIMEOUT to TIMEOUT', () => {
    assert.equal(gateway.mapPineLabsStatus('TIMEOUT'), 'TIMEOUT');
  });
});

describe('bank offer calculation logic', () => {
  it('calculates HDFC percentage offer correctly', () => {
    const subtotal = 50000;
    const discount = calculatePercentageDiscount(subtotal, 10, 3000);
    assert.equal(discount, 3000);
  });

  it('calculates SBI fixed offer correctly', () => {
    const subtotal = 20000;
    const discount = calculateFixedDiscount(subtotal, 1500);
    assert.equal(discount, 1500);
  });

  it('rejects discount exceeding subtotal', () => {
    assert.equal(calculateFixedDiscount(500, 1000), 500);
  });
});
