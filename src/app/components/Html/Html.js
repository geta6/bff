/* eslint-disable react/no-danger */

import React from 'react';
import PureComponent from 'react-immutable-pure-component';
import PropTypes from 'prop-types';
import Icons from './Icons.svg';

export default class Html extends PureComponent {
  static propTypes = {
    styles: PropTypes.string.isRequired,
    assets: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    dehydrated: PropTypes.string.isRequired,
  };

  render = () => (
    <html className="has-navbar-fixed-top">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>title</title>
        <style id="style" dangerouslySetInnerHTML={{ __html: this.props.styles }} />
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: Icons }} style={{ display: 'none' }} />
        <div id="root" dangerouslySetInnerHTML={{ __html: this.props.children }} />
        <script dangerouslySetInnerHTML={{ __html: this.props.dehydrated }} />
        {this.props.assets.vendor && <script id="vendor" src={this.props.assets.vendor.js} />}
        {this.props.assets.client && <script id="client" src={this.props.assets.client.js} async defer />}
      </body>
    </html>
  );
}
