import React from 'react';
import { SetProxyRootCertificate as Component } from './SetProxyRootCertificate';
import { RecoilRoot } from 'recoil';

export default {
  title: 'organisms/InitialSettings',
};

export const SetProxyRootCertificate = () => (
  <RecoilRoot>
    <Component />
  </RecoilRoot>
);
