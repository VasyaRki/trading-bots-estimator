export class PriceRecord {
  constructor(symbol, provider, price, timestamp) {
    if (!symbol || !provider || price === undefined || !timestamp) {
      throw new Error('PriceRecord requires symbol, provider, price, and timestamp');
    }
    
    this.symbol = symbol;
    this.provider = provider;
    this.price = Number(price);
    this.timestamp = Number(timestamp);
    
    if (isNaN(this.price) || isNaN(this.timestamp)) {
      throw new Error('Price and timestamp must be valid numbers');
    }
  }
  
  calculatePercentageChange(other) {
    if (!other || !(other instanceof PriceRecord)) {
      throw new Error('Cannot calculate percentage change: invalid comparison record');
    }
    
    if (other.price === 0) {
      throw new Error('Cannot calculate percentage change: division by zero');
    }
    
    return ((this.price - other.price) / other.price) * 100;
  }
  
  isOlderThan(timestamp) {
    return this.timestamp < timestamp;
  }
  
  equals(other) {
    return other instanceof PriceRecord &&
           this.symbol === other.symbol &&
           this.provider === other.provider &&
           this.price === other.price &&
           this.timestamp === other.timestamp;
  }
}