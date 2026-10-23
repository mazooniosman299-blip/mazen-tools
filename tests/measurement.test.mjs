import test from 'node:test';
import assert from 'node:assert/strict';
import {canMeasure, startMeasurement} from '../src/measurement.js';
test('disabled measurement has no browser or network side effects', () => {
  assert.doesNotThrow(() => startMeasurement({enabled: false}));
});
test('analytics requires an actual property, consent, privacy review and adapter, and honors DNT', () => {
  const config = {enabled: true, ga4MeasurementId: 'G-ABC1234567', certifiedConsentAdapterReady: true, privacyReviewed: true};
  const consent = {analyticsAllowed: true, certifiedAdapter: true};
  assert.equal(canMeasure(config, consent), true);
  assert.equal(canMeasure(config, consent, true), false);
  assert.equal(canMeasure(config, {analyticsAllowed: false}), false);
  assert.equal(canMeasure({...config, privacyReviewed: false}, consent), false);
  assert.equal(canMeasure({...config, ga4MeasurementId: ''}, consent), false);
});
