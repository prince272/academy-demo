import './utilities/polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import Popper from 'popper.js';
import App from './components/App';
import * as serviceWorker from './utilities/serviceWorker';

// Required to enable animations on dropdowns/tooltips/popovers
Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false;

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();