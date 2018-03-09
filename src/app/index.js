import Fluxible from 'fluxible';
import batchedUpdatePlugin from 'fluxible-addons-react/batchedUpdatePlugin';
import component from './containers/App';
import RouteStore from './stores/Route';
import requestPlugin from './utils/requestPlugin';

const app = new Fluxible({
  component,
  stores: [RouteStore],
});

app.plug(batchedUpdatePlugin());
app.plug(requestPlugin());

export default app;
