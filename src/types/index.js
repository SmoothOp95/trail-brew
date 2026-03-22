/**
 * @fileoverview Trail Brew data model definitions (JSDoc types)
 * Ported functional requirements from Mountain-bike-dashboard.
 * No UI, no styling — pure data contracts.
 */

/**
 * Bike configuration and running service totals.
 * Stored at: /users/{uid}.bikeData (merged field on user document)
 *
 * @typedef {Object} BikeData
 * @property {string}  nickname                 - User-assigned bike name
 * @property {string}  lastServiceDate          - ISO 8601 date of last service, e.g. "2025-10-01"
 * @property {number}  totalDistance            - km accumulated since last service
 * @property {number}  totalHours               - riding hours accumulated since last service
 * @property {number}  serviceIntervalDistance  - user-configured km interval (default 500)
 * @property {number}  serviceIntervalHours     - user-configured hours interval (default 50)
 * @property {string}  [bikeImage]              - optional base64 data URL of bike photo
 */

/** @type {BikeData} */
export const DEFAULT_BIKE_DATA = {
  nickname: 'Trail Blazer',
  lastServiceDate: '',
  totalDistance: 0,
  totalHours: 0,
  serviceIntervalDistance: 500,
  serviceIntervalHours: 50,
};

/**
 * A completed service event.
 * Stored in subcollection: /users/{uid}/serviceHistory/{docId}
 *
 * @typedef {Object} ServiceRecord
 * @property {string}          id                  - Firestore document ID
 * @property {string}          date                - ISO 8601 date
 * @property {string}          shopName            - Workshop name or "Self"
 * @property {number}          cost                - ZAR amount
 * @property {number}          distanceAtService   - Odometer reading at service time
 * @property {number}          hoursAtService      - Hours reading at service time
 * @property {'minor'|'major'} serviceType         - Scope of service
 * @property {'service'}       type                - Discriminator
 */

/**
 * An ad-hoc repair event.
 * Stored in subcollection: /users/{uid}/repairHistory/{docId}
 *
 * @typedef {Object} RepairRecord
 * @property {string}    id                  - Firestore document ID
 * @property {string}    date                - ISO 8601 date
 * @property {string}    shopName            - Workshop name or "Self"
 * @property {number}    cost                - ZAR amount
 * @property {number}    distanceAtService   - Odometer snapshot at repair time
 * @property {number}    hoursAtService      - Hours snapshot at repair time
 * @property {string}    description         - Free-text description of the repair
 * @property {'repair'}  type                - Discriminator
 */

/**
 * Union of service and repair records for combined history display.
 * @typedef {ServiceRecord | RepairRecord} MaintenanceRecord
 */

/**
 * Strava OAuth tokens.
 * @typedef {Object} StravaTokens
 * @property {string} access_token    - Short-lived access token
 * @property {string} refresh_token   - Long-lived refresh token
 * @property {number} expires_at      - Unix timestamp of access token expiry
 */

/**
 * Strava connection state.
 * Stored at: /users/{uid}.stravaConnection (merged field on user document)
 *
 * @typedef {Object} StravaConnection
 * @property {string}  access_token
 * @property {string}  refresh_token
 * @property {number}  expires_at
 * @property {boolean} connected    - Whether user has an active connection
 * @property {string}  [lastSync]   - ISO 8601 timestamp of last successful sync
 */

/**
 * A single Strava activity returned from the API.
 * @typedef {Object} StravaActivity
 * @property {number} id
 * @property {string} name
 * @property {number} distance      - Metres — divide by 1000 for km
 * @property {number} moving_time   - Seconds
 * @property {number} elapsed_time  - Seconds
 * @property {string} type          - e.g. "Ride", "VirtualRide"
 * @property {string} start_date    - ISO 8601
 */

/**
 * A Skills Academy product for the clinic booking page.
 * @typedef {Object} Product
 * @property {string}   id            - Unique identifier
 * @property {string}   name          - Display name
 * @property {string}   description   - Short description
 * @property {number}   priceInCents  - ZAR × 100
 * @property {string[]} features      - Bullet-point feature list
 * @property {string}   [paymentLink] - Stripe Payment Link URL
 * @property {boolean}  [popular]     - Show "Popular" badge
 * @property {boolean}  [comingSoon]  - Disable booking CTA
 */

/**
 * Service status result from calculateServiceStatus().
 * @typedef {Object} ServiceStatus
 * @property {'good'|'warning'|'overdue'} status
 * @property {string} message
 */
