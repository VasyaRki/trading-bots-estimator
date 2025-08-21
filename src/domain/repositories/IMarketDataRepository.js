export class IMarketDataRepository {
  async addPriceRecord(priceRecord) {
    throw new Error('Method must be implemented');
  }

  async addOpenInterestRecord(oiRecord) {
    throw new Error('Method must be implemented');
  }

  async cleanupOldData(cutoffTimestamp) {
    throw new Error('Method must be implemented');
  }
}
