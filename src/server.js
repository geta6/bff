import uniq from 'lodash/uniq';
import path from 'path';
import express from 'express';
import compression from 'compression';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import responseTime from 'response-time';
import serialize from 'serialize-javascript';
import navigateAction from 'fluxible-router/lib/navigateAction';
import React from 'react';
import ReactDOM from 'react-dom/server';
import CleanCss from 'clean-css';
import PrettyError from 'pretty-error';
import Html from './app/components/Html';
import app from './app';
import assets from './assets.json'; // eslint-disable-line import/no-unresolved, import/extensions

const srv = express();
const css = new CleanCss();
const err = new PrettyError();

err.skipNodeFiles();
err.skipPackage('express');
err.alias(`${__dirname}/webpack:/`, '');

srv.use(compression({ filter: (req, res) => !req.headers['x-no-compression'] && compression.filter(req, res) }));
srv.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
srv.use(helmet());
srv.use(responseTime());
srv.use(morgan('dev'));
srv.use(express.static(path.join(__dirname, 'public')));
srv.use(cookieParser());
srv.use(bodyParser.urlencoded({ extended: true }));
srv.use(bodyParser.json());

srv.get('*', async (req, res, next) => {
  try {
    const context = app.createContext({ optimizePromiseCallback: true });

    await Promise.all([context.executeAction(navigateAction, { url: req.url })]);

    const _styles = [];
    const componentContext = Object.assign(context.getComponentContext(), {
      insertCss: (s) => _styles.push(s._getCss()), // eslint-disable-line private-props/no-use-outside
    });

    const element = React.createElement(context.getComponent(), { context: componentContext });
    const children = ReactDOM.renderToString(element);
    const styles = css.minify(uniq(_styles).join('')).styles;
    const dehydrated = `window.dehydrated=${serialize(app.dehydrate(context))}`;
    res.setHeader('content-type', 'text/html');
    ReactDOM.renderToNodeStream(React.createElement(Html, { context, assets, styles, dehydrated }, children)).pipe(res);
  } catch (e) {
    next(e);
  }
});

// eslint-disable-next-line no-unused-vars
srv.use((e, req, res, next) => {
  res.status(err.status || 500);
  res.send('<!doctype html>ERROR');
  console.error(err.render(e));
});

const server = srv.listen(process.env.PORT, process.env.HOST, () => {
  const { port } = server.address();
  console.info(`Web Server is available at http://localhost:${port}/ (bind address ${process.env.HOST})`);
});

if (module.hot) {
  server.hot = module.hot;
  module.hot.accept('./app');
}

export default server;
