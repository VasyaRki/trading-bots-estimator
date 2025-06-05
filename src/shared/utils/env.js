/** @typedef {import('./types').Utils} Utils */

/** @type {Utils['requireEnv']} */
export const requireEnv = (name) => {
  const env = process.env[name];
  if (!env) throw new Error(`Missing required env "${name}"`);
  return env;
};
