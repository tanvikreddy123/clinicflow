/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Use jest's built-in test function (typed import for better intellisense)
import {it} from '@jest/globals';

// React Native snapshot renderer
import renderer from 'react-test-renderer';

//Simple smoke test to make sure <App /> renders without crashing
it('renders correctly', () => {
  renderer.create(<App />);
});
