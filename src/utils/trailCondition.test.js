import { describe, it, expect } from 'vitest';
import { gradeConditions, CONDITION_GRADES } from './trailCondition';

describe('gradeConditions', () => {
  it('returns PRIME when fully dry', () => {
    expect(gradeConditions({ rain1h: 0, rain24h: 0, rain48h: 0 })).toBe(
      CONDITION_GRADES.PRIME
    );
  });

  it('returns AVOID when actively raining (>0.5mm in last hour)', () => {
    expect(gradeConditions({ rain1h: 0.6, rain24h: 0, rain48h: 0 })).toBe(
      CONDITION_GRADES.AVOID
    );
  });

  it('active rain outranks everything else', () => {
    expect(gradeConditions({ rain1h: 5, rain24h: 50, rain48h: 80 })).toBe(
      CONDITION_GRADES.AVOID
    );
  });

  it('returns MUDDY after heavy 24h rain (>20mm)', () => {
    expect(gradeConditions({ rain1h: 0, rain24h: 25, rain48h: 25 })).toBe(
      CONDITION_GRADES.MUDDY
    );
  });

  it('returns SOFT after moderate 24h rain (>8mm)', () => {
    expect(gradeConditions({ rain1h: 0, rain24h: 10, rain48h: 10 })).toBe(
      CONDITION_GRADES.SOFT
    );
  });

  it('returns GOOD when rain fell earlier in the 48h window (>5mm)', () => {
    expect(gradeConditions({ rain1h: 0, rain24h: 2, rain48h: 12 })).toBe(
      CONDITION_GRADES.GOOD
    );
  });

  it('boundary: exactly 0.5mm in the last hour is not AVOID', () => {
    expect(gradeConditions({ rain1h: 0.5, rain24h: 0, rain48h: 0 })).toBe(
      CONDITION_GRADES.PRIME
    );
  });

  it('boundary: exactly 20mm in 24h grades SOFT, not MUDDY', () => {
    expect(gradeConditions({ rain1h: 0, rain24h: 20, rain48h: 20 })).toBe(
      CONDITION_GRADES.SOFT
    );
  });
});
