import { ipcRenderer } from 'electron';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { INITIALIZE } from './ipc/ipcEventNames';
import { wrapPromise } from './libs/wrapPromise';
import { Config } from './types/config';

const app = document.getElementById('app');

const initialize = wrapPromise<Config | undefined>(ipcRenderer.invoke(INITIALIZE));

const InitializePage: React.VFC = () => {
  initialize.read();

  return <h1>start</h1>;
};

ReactDOM.render(
  <Suspense fallback={<p>Loading</p>}>
    <InitializePage />
  </Suspense>,
  app
);
