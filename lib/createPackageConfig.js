import pkg from '../package.json';

export default () => ({
  apps: Object.assign({}, require(`../etc/pm2/${process.env.NODE_ENV}.json`)),
  scripts: {
    start: 'pm2 startOrReload package.json && pm2 save',
    stop: 'pm2 kill',
  },
  private: true,
  dependencies: pkg.dependencies,
});
