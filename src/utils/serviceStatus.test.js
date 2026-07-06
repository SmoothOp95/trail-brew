import { describe, it, expect } from 'vitest';
import { calculateServiceStatus, calculateProgressPcts } from './serviceStatus';

// DEFAULT_BIKE_DATA intervals: 500 km / 50 hours
describe('calculateServiceStatus', () => {
  it('reports good when well under both intervals', () => {
    const result = calculateServiceStatus({ totalDistance: 100, totalHours: 10 });
    expect(result.status).toBe('good');
  });

  it('reports warning at 80% of the distance interval', () => {
    const result = calculateServiceStatus({ totalDistance: 400, totalHours: 0 });
    expect(result.status).toBe('warning');
  });

  it('reports overdue at 100% of the hours interval', () => {
    const result = calculateServiceStatus({ totalDistance: 0, totalHours: 50 });
    expect(result.status).toBe('overdue');
  });

  it('is driven by whichever metric is proportionally closer to its interval', () => {
    // 90% distance, 10% hours → warning
    const result = calculateServiceStatus({ totalDistance: 450, totalHours: 5 });
    expect(result.status).toBe('warning');
  });

  it('respects custom service intervals', () => {
    const result = calculateServiceStatus({
      totalDistance: 90,
      totalHours: 0,
      serviceIntervalDistance: 100,
      serviceIntervalHours: 50,
    });
    expect(result.status).toBe('warning');
  });

  it('falls back to defaults for missing fields', () => {
    expect(calculateServiceStatus({}).status).toBe('good');
  });
});

describe('calculateProgressPcts', () => {
  it('returns proportional percentages', () => {
    const { distancePct, hoursPct } = calculateProgressPcts({
      totalDistance: 250,
      totalHours: 25,
    });
    expect(distancePct).toBe(50);
    expect(hoursPct).toBe(50);
  });

  it('clamps both percentages at 100', () => {
    const { distancePct, hoursPct } = calculateProgressPcts({
      totalDistance: 9999,
      totalHours: 9999,
    });
    expect(distancePct).toBe(100);
    expect(hoursPct).toBe(100);
  });
});
