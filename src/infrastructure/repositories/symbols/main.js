import { selectSymbols, insertSymbol } from './sql.js';

/** @type {import('./types.js').init} */
export const init = (pool) => ({
  getSymbols: async (provider) => {
    const { query, params } = selectSymbols(provider);
    const { rows } = await pool.query(query, params);

    return rows;
  },

  saveSymbol: async (symbol, provider) => {
    const { query, params } = insertSymbol(symbol, provider);
    await pool.query(query, params);
  },
});
