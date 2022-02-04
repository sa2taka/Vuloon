import React from 'react';
import { Welcome as Component } from './Welcome';
import { RecoilRoot } from 'recoil';

export default {
  title: 'organisms/Welcome',
};

export const Welcome = () => (
  <RecoilRoot>
    <Component />
  </RecoilRoot>
);
