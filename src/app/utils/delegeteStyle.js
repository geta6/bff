import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import hoistStatics from 'hoist-non-react-statics';

export default (style) => (ComposedComponent) => {
  class DelegateStyle extends PureComponent {
    static displayName = `DelegateStyle(${ComposedComponent.displayName || 'Component'})`;

    static contextTypes = {
      insertCss: PropTypes.func.isRequired,
    };

    componentWillMount = () => {
      this.removeCss = this.context.insertCss(style);
    };

    componentWillUnmount = () => {
      this.removeCss && setTimeout(this.removeCss, 0);
    };

    render = () => <ComposedComponent s={style} {...this.props} />;
  }

  return hoistStatics(DelegateStyle, ComposedComponent);
};
