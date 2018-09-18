import 'unfetch/polyfill';
import '@babel/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

function boot() {
  const mountRootNode = document.getElementById('root');

  let render = () => {
    ReactDOM.render(<App />, mountRootNode);
  };

  if (process.env.NODE_ENV === 'development') {
    if (module.hot) {
      const renderApp = render;
      const renderError = (error) => {
        const RedBox = require('redbox-react').default;
        ReactDOM.render(<RedBox error={error} />, mountRootNode);
      };

      render = () => {
        try {
          renderApp();
        } catch (err) {
          renderError(err);
        }
      };

      module.hot.accept();
    }
  }

  render();

  if (window.hideLoading) {
    window.hideLoading();
  }
}

boot();
