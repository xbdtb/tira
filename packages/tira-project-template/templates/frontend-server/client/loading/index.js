import React from 'react';
import ReactDOM from 'react-dom';
import Loading from './loading';

const render = () => {
  const mountLoadingtNode = document.getElementById('loading');
  if (mountLoadingtNode) {
    ReactDOM.render(<Loading fullScreen spinning />, mountLoadingtNode);
  }
};

window.hideLoading = () => {
  const mountLoadingtNode = document.getElementById('loading');
  if (mountLoadingtNode) {
    setTimeout(() => {
      ReactDOM.render(<Loading fullScreen spinning={false} />, mountLoadingtNode);
      setTimeout(() => {
        mountLoadingtNode.parentNode.removeChild(mountLoadingtNode);
      }, 1000);
    }, 0);
  }
  window.hideLoading = undefined;
};

render();
