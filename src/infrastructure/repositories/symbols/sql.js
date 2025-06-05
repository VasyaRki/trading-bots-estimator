/**
 * @typedef {import('../../../entities/crypto').Ticker} Ticker
 * @typedef {import('../../../entities/crypto').Bar} Bar
 */

/**
 * @param {number=} limit
 * @returns {{ query: string, params: any[] }}
 */
export const selectSymbols = (provider) => {
  let query = 'SELECT * FROM symbols';
  const params = [];

  if (provider) {
    query += ' WHERE provider = $1';
    params.push(provider);
  }

  return { query, params };
};

/**
 * @param {Ticker} ticker
 * @returns {{ query: string, params: any[] }}
 */
export const insertSymbol = (symbol, provider) => {
  const query = `
    INSERT INTO symbols
    ("symbol", "provider")
    VALUES ($1, $2)
    `;

  const params = [symbol, provider];

  return { query, params };
};
