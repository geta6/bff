import keyMirror from 'fbjs/lib/keyMirror';
import { createStore } from 'fluxible/addons';
import { fromJS, is } from 'immutable';

export default (storeName, properties) =>
  Object.assign(
    createStore({
      storeName,

      ...properties,

      initialize() {
        this.data = fromJS(properties.defaults || {});
        if (properties.initialize) {
          properties.initialize.call(this);
        }
      },

      get(paths) {
        return this.data.getIn(Array.isArray(paths) ? paths : [paths]);
      },

      set(paths, _data) {
        const data = fromJS(_data);
        if (!is(this.get(paths), data)) {
          this.data = this.data.setIn(Array.isArray(paths) ? paths : [paths], data);
          this.emitChange();
          return true;
        }
        return false;
      },
    }),
    { dispatchTypes: keyMirror(properties.handlers) },
  );
