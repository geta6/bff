import path from 'path';

export default (options = {}) => {
  const GLOBALS = Object.assign({}, require('../etc/env/_defaults.json'));
  try {
    Object.assign(GLOBALS, require(`../etc/env/${process.env.NODE_ENV}.json`));
  } catch (e) {
    /* ignoreable */
  } finally {
    for (const key of Object.keys(GLOBALS)) {
      const val = GLOBALS[key];
      GLOBALS[`process.env.${key}`] = JSON.stringify(val);
      process.env[key] = val;
      delete GLOBALS[key];
    }
  }

  return {
    HOT: !!options.hot,
    DEBUG: process.env.NODE_ENV !== 'production',
    VERBOSE: false,
    BASEDIR: path.join(__dirname, '..'),
    GLOBALS,
  };
};
