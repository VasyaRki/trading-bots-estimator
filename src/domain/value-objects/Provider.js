export class Provider {
  static VALID_PROVIDERS = ['binance', 'bybit'];
  
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('Provider value must be a non-empty string');
    }
    
    const normalizedValue = value.toLowerCase();
    
    if (!Provider.VALID_PROVIDERS.includes(normalizedValue)) {
      throw new Error(`Invalid provider: ${value}. Valid providers: ${Provider.VALID_PROVIDERS.join(', ')}`);
    }
    
    this.value = normalizedValue;
  }
  
  equals(other) {
    return other instanceof Provider && this.value === other.value;
  }
  
  toString() {
    return this.value;
  }
  
  static isValid(value) {
    try {
      new Provider(value);
      return true;
    } catch {
      return false;
    }
  }
}