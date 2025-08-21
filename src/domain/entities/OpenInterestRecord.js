export class OpenInterestRecord {
  constructor(symbol, provider, openInterest, timestamp) {
    if (!symbol || !provider || openInterest === undefined || !timestamp) {
      throw new Error('OpenInterestRecord requires symbol, provider, openInterest, and timestamp');
    }
    
    this.symbol = symbol;
    this.provider = provider;
    this.openInterest = Number(openInterest);
    this.timestamp = Number(timestamp);
    
    if (isNaN(this.openInterest) || isNaN(this.timestamp)) {
      throw new Error('OpenInterest and timestamp must be valid numbers');
    }
  }
  
  calculatePercentageChange(other) {
    if (!other || !(other instanceof OpenInterestRecord)) {
      throw new Error('Cannot calculate percentage change: invalid comparison record');
    }
    
    if (other.openInterest === 0) {
      throw new Error('Cannot calculate percentage change: division by zero');
    }
    
    return ((this.openInterest - other.openInterest) / other.openInterest) * 100;
  }
  
  isOlderThan(timestamp) {
    return this.timestamp < timestamp;
  }
  
  equals(other) {
    return other instanceof OpenInterestRecord &&
           this.symbol === other.symbol &&
           this.provider === other.provider &&
           this.openInterest === other.openInterest &&
           this.timestamp === other.timestamp;
  }
}