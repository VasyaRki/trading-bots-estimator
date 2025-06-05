export const CONSTANTS = Object.freeze({
  PUBLISHER: {
    CHANELS: {
      OPEN_INTEREST_EVENT: 'OPEN_INTEREST_EVENT',
      OI_UPDATE: 'OI_UPDATE',
      PRICE_UPDATE: 'PRICE_UPDATE',
    },
  },
  REDIS: {
    OPEN_INTEREST_SIGNAL_COUNT_TTL: 86400,
    OPEN_INTEREST_SIGNAL_COUNT_PREFIX: 'open-interest-signal',
    OI_HISTORY: 'open-interest-history',
    PRICE_HISTORY: 'price-history',
  },
  DOMAIN: {
    PRICE_PRECISION: 2,
    MIN_OI_PERCENTAGE_DIFFERENCE: 5,
    TIME: {
      THIRTY_MINUTS: 30 * 60000,
    },
  },
});
