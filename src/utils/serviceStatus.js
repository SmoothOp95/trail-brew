/**
 * @fileoverview Service status calculation logic.
 * Ported directly from Mountain-bike-dashboard.
 * Pure function — no React, no Firebase, no side effects.
 */

import { DEFAULT_BIKE_DATA } from '../types/index';

/**
 * Calculates whether a bike is due for service based on distance and hours
 * accumulated since the last service.
 *
 * Status is driven by whichever metric (distance OR hours) is proportionally
 * closer to its configured interval — a bike at 90% distance but 10% hours
 * is still "warning".
 *
 * @param {import('../types/index').BikeData} bikeData
 * @returns {import('../types/index').ServiceStatus}
 */
export function calculateServiceStatus(bikeData) {
  const data = { ...DEFAULT_BIKE_DATA, ...bikeData };

  const distanceProgress =
    (data.totalDistance / data.serviceIntervalDistance) * 100;
  const hoursProgress =
    (data.totalHours / data.serviceIntervalHours) * 100;

  const maxProgress = Math.max(distanceProgress, hoursProgress);

  if (maxProgress >= 100) {
    return { status: 'overdue', message: 'Service overdue!' };
  }
  if (maxProgress >= 80) {
    return { status: 'warning', message: 'Service due soon' };
  }
  return { status: 'good', message: 'Service up to date' };
}

/**
 * Returns clamped progress percentages for both metrics.
 * Used to drive the two progress bars in BikeStatusCard.
 *
 * @param {import('../types/index').BikeData} bikeData
 * @returns {{ distancePct: number, hoursPct: number }}
 */
export function calculateProgressPcts(bikeData) {
  const data = { ...DEFAULT_BIKE_DATA, ...bikeData };

  const distancePct = Math.min(
    (data.totalDistance / data.serviceIntervalDistance) * 100,
    100
  );
  const hoursPct = Math.min(
    (data.totalHours / data.serviceIntervalHours) * 100,
    100
  );

  return { distancePct, hoursPct };
}
