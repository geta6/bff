import React from 'react';
import PropTypes from 'prop-types';
import ReactImmutablePropTypes from 'react-immutable-proptypes';
import PureComponent from 'react-immutable-pure-component';
import provideContext from 'fluxible-addons-react/provideContext';
import connectToStores from 'fluxible-addons-react/connectToStores';
import handleHistory from 'fluxible-router/lib/handleHistory';
import delegateStyle from '../../utils/delegeteStyle';

@provideContext({ insertCss: PropTypes.func.isRequired })
@handleHistory()
@connectToStores(['RouteStore'], (context) => ({
  route: context.getStore('RouteStore').getRoute(),
  error: context.getStore('RouteStore').getError(),
}))
@delegateStyle(require('./App.pcss'))
export default class App extends PureComponent {
  static propTypes = {
    s: PropTypes.object.isRequired,
    route: ReactImmutablePropTypes.map.isRequired,
    error: ReactImmutablePropTypes.map.isRequired,
  };

  render = () => {
    const { s } = this.props;
    const RouteHandler = this.props.route.get('handler');
    return (
      <div id={s.main}>
        {RouteHandler && this.props.error.isEmpty() ? (
          <RouteHandler />
        ) : (
          <div id={s.error}>
            {JSON.stringify(this.props.error.toJS())}
          </div>
        )}
      </div>
    );
  }
}
