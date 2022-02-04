import { Layout } from '@/renderer/components/Layout';
import { InitialSetting } from '@/renderer/components/windows/InitialSetting';
import { Main } from '@/renderer/components/windows/Main';
import React from 'react';
import ReactDom from 'react-dom';
import { RecoilRoot } from 'recoil';

const renderProps = (): [React.ReactElement<any, any>, ReactDom.Container | null] => {
  if (document.getElementById('main-app')) {
    const root = document.getElementById('main-app');
    const child = <Main />;
    return [child, root];
  } else if (document.getElementById('initial-setting-app')) {
    const root = document.getElementById('initial-setting-app');
    const child = <InitialSetting />;
    return [child, root];
  } else {
    const root = document.body;
    const child = <h1>unexpected</h1>;
    return [child, root];
  }
};

const [child, root] = renderProps();

ReactDom.render(
  <RecoilRoot>
    <Layout>{child}</Layout>
  </RecoilRoot>,
  root
);
