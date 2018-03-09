import fs from 'fs-extra';
import path from 'path';
import gulp from 'gulp';
import run from 'run-sequence';
import log from 'fancy-log';
import colors from 'ansi-colors';
import chokidar from 'chokidar';
import express from 'express';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import query from 'connect-query';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import browserSync from 'browser-sync';
import webpackConfig from './webpack.config.babel';
import createPackageConfig from './lib/createPackageConfig';
import createOptimizedSymbols from './lib/createOptimizedSymbols';

gulp.task('clean', async () => {
  await fs.remove('tmp/build');
  await fs.ensureDir('tmp/build');
});

gulp.task('copy', async () => {
  await fs.ensureDir('tmp/build');
  await Promise.all([
    fs.writeJson('tmp/build/package.json', createPackageConfig(), { spaces: 2 }),
    fs.copy('.node-version', 'tmp/build/.node-version'),
    fs.copy('yarn.lock', 'tmp/build/yarn.lock'),
    fs.copy('src/public', 'tmp/build/public'),
  ]);
});

gulp.task('watch', () => {
  chokidar.watch(['src/public/**/*'], { ignoreInitial: true }).on('all', async (event, file) => {
    log(`Starting '${colors.cyan(`watch:${event}`)}'...`);
    const start = process.hrtime();
    const source = path.relative('./', file);
    const target = path.join('tmp/build', path.relative('src', source));
    if (['add', 'change'].includes(event)) {
      await fs.ensureDir(path.dirname(target));
      await fs.copy(file, target);
    } else if (['unlink', 'unlinkDir'].includes(event)) {
      await fs.remove(target);
    } else {
      return;
    }
    const hrDuration = process.hrtime(start);
    const duration = `${(hrDuration[0] + hrDuration[1] / 1e9) * 1000}`.toFixed(2);
    log(`Finished '${colors.cyan(`watch:${event}`)}' after ${colors.magenta(`${duration} ms`)}`);
  });
  chokidar.watch(['var/icons/*'], { ignoreInitial: true }).on('all', async (event) => {
    log(`Starting '${colors.cyan(`watch:${event}`)}'...`);
    const start = process.hrtime();
    await new Promise((resolve) => run('icons', resolve));
    const hrDuration = process.hrtime(start);
    const duration = `${(hrDuration[0] + hrDuration[1] / 1e9) * 1000}`.toFixed(2);
    log(`Finished '${colors.cyan(`watch:${event}`)}' after ${colors.magenta(`${duration} ms`)}`);
  });
});

gulp.task('bundle', async () => {
  const config = webpackConfig({ hot: false });
  await new Promise((resolve, reject) => {
    webpack(config).run((err, stats) => {
      if (err) return reject(err);
      log(`\n${stats.toString(config[0].stats)}`);
      if (stats.hasErrors()) return reject(new Error('Webpack compilation errors'));
      return resolve();
    });
  });
});

gulp.task('build', async () => {
  await new Promise((resolve) => run('clean', 'copy', 'icon', 'bundle', resolve));
});

gulp.task('start', async () => {
  let server;

  const watchOptions = { ignored: /node_modules/ };

  const checkForUpdate = async () => {
    if (server.hot && server.hot.status() === 'idle') {
      try {
        const modules = await server.hot.check(true);
        if (modules) {
          if (modules.length > 0) {
            log('Updated modules:');
            modules.forEach((id) => log(`  ${colors.magenta(id)}`));
            checkForUpdate();
          } else {
            log('Nothing hot updated.');
          }
        }
      } catch (error) {
        if (['abort', 'fail'].includes(server.hot.status())) {
          log('Cannot apply update.');
          server && server.close();
          delete require.cache[require.resolve('./tmp/build/server')];
          server = require('./tmp/build/server').default; // eslint-disable-line import/no-unresolved
          log('App has been reloaded.');
        } else {
          log(`Update failed: ${error.stack || error.message}`);
        }
      }
    }
  };

  const middleware = [query()];
  middleware.push(errorOverlayMiddleware());
  middleware.push(express.static(path.join(__dirname, 'src', 'public')));

  const config = webpackConfig({ hot: true });
  const serverConfig = config.find(({ name }) => name === 'server');
  const clientConfig = config.find(({ name }) => name === 'client');

  await new Promise((resolve) => run('clean', 'copy', 'icon', 'watch', resolve));

  const multiCompiler = webpack(config);
  const clientCompiler = multiCompiler.compilers.find(({ name }) => name === 'client');
  const serverCompiler = multiCompiler.compilers.find(({ name }) => name === 'server');

  const webpackDevOption = { publicPath: clientConfig.output.publicPath, logLevel: 'silent', watchOptions };
  middleware.push(webpackDevMiddleware(clientCompiler, webpackDevOption));
  middleware.push(webpackHotMiddleware(clientCompiler, { log: false }));

  const clientPromise = new Promise((resolve, reject) => {
    clientCompiler.hooks.compile.tap('client', () => log(`Compiling '${colors.cyan('client')}'...`));
    clientCompiler.hooks.done.tap('client', (stats) => {
      log(stats.toString(clientConfig.stats));
      stats.hasErrors() ? reject(new Error('Failed to compiled')) : resolve(stats);
    });
  });

  const serverPromise = new Promise((resolve, reject) => {
    clientCompiler.hooks.compile.tap('server', () => log(`Compiling '${colors.cyan('server')}'...`));
    serverCompiler.hooks.done.tap('server', (stats) => {
      log(stats.toString(serverConfig.stats));
      stats.hasErrors() ? reject(new Error('Failed to compiled')) : resolve(stats);
    });
  });

  serverCompiler.watch(watchOptions, (e, stats) => {
    server && !e && !stats.hasErrors() && checkForUpdate();
  });

  await clientPromise;
  await serverPromise;

  server = require('./tmp/build/server').default; // eslint-disable-line import/no-unresolved

  await new Promise((resolve) => {
    browserSync.create().init(
      {
        port: +process.env.PORT + 1,
        proxy: { ws: true, target: `localhost:${process.env.PORT}`, middleware },
        online: false,
        cors: true,
        ui: false,
        notify: false,
        logPrefix: 'App',
        ghostMode: false,
        reloadOnRestart: true,
      },
      resolve,
    );
  });
});

gulp.task('icon', async () => {
  const { svg, types } = await createOptimizedSymbols('Icons', path.join(__dirname, 'var', 'icons'));
  await fs.writeFile(path.join(__dirname, 'src', 'app', 'components', 'Html', 'Icons.svg'), svg);
  await fs.writeJson(path.join(__dirname, 'src', 'app', 'components', 'Icon', 'Icon.json'), types, { spaces: 2 });
});
