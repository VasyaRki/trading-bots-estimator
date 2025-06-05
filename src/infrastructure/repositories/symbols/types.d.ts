import type { Pool } from 'pg';

export class SymbolRepo {
  getSymbols: (provider?: 'binance' | 'bybit') => Promise<T[]>;
  saveSymbol: (symbol: string, provider: 'binance' | 'bybit') => Promise<void>;
}

export function init(pg: Pool): SymbolRepo;
