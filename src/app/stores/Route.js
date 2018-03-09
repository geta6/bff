import set from 'lodash/set';
import clone from 'lodash/cloneDeep';
import pickBy from 'lodash/pickBy';
import { fromJS } from 'immutable';
import RouteStore from 'fluxible-router/lib/RouteStore';
import IndexHandler from '../handlers/Index';

const routeStore = RouteStore.withStaticRoutes({
  index: {
    path: '/',
    handler: IndexHandler,
  },
});

Object.assign(routeStore.prototype, {
  getRoute: function getRoute() {
    return fromJS(routeStore.prototype.getCurrentRoute.call(this) || {});
  },

  getError: function getError() {
    return fromJS(routeStore.prototype.getCurrentNavigateError.call(this) || {});
  },

  dehydrate: function dehydrate() {
    const navigate = clone(this._currentNavigate);
    return {
      currentNavigate: set(navigate, 'route', pickBy(navigate.route, (v) => typeof v !== 'function')),
      routes: this._routes,
    };
  },
});

export default routeStore;
