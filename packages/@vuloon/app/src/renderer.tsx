import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { useConfig } from './domain/repositories/config';

const app = document.getElementById('app');

const InitializePage: React.VFC = () => {
  useConfig();
  return <h1>start</h1>;
};

ReactDOM.render(
  <Suspense fallback={<p>Loading</p>}>
    <InitializePage />
  </Suspense>,
  app
);
