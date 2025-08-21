export class Symbol {
  constructor(symbol, provider) {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Symbol must be a non-empty string');
    }
    
    if (!provider || typeof provider !== 'string') {
      throw new Error('Provider must be a non-empty string');
    }
    
    this.symbol = symbol.toUpperCase();
    this.provider = provider.toLowerCase();
  }
  
  equals(other) {
    return other instanceof Symbol &&
           this.symbol === other.symbol &&
           this.provider === other.provider;
  }
  
  toString() {
    return `${this.symbol}@${this.provider}`;
  }
}