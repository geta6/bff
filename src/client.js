import domready from 'domready';
import React from 'react';
import ReactDOM from 'react-dom';
import deepForceUpdate from 'react-deep-force-update';

let appInstance;

domready(async () => {
  const { default: app } = await import('./app');
  const container = document.getElementById('root');
  const context = await new Promise((resolve, reject) => {
    app.rehydrate(window.dehydrated || {}, (err, ctx) => (err ? reject(err) : resolve(ctx)));
  });
  const componentContext = Object.assign(context.getComponentContext(), {
    insertCss: ({ _insertCss }) => _insertCss(),
  });
  const component = React.createElement(context.getComponent(), { context: componentContext });
  appInstance = ReactDOM.hydrate(component, container);
});

if (process.env.NODE_ENV === 'production') {
  domready(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('sw.js');
        console.info('SW registered: %o', registration);
      } catch (error) {
        console.warn('SW registration failed: %o', error);
      }
    }
  });
}

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    module.hot.accept(() => {
      if (appInstance && appInstance.updater.isMounted(appInstance)) {
        deepForceUpdate(appInstance);
      }
    });
  }
}
