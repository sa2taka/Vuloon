import { RequestList } from '@/renderer/components/organisms/RequestList';
import { initialize } from '@/renderer/domain/service/initializer/mainInitializer';
import React, { useEffect } from 'react';
import { ProxyToggleButton } from '../molecules/ProxyToggleButton';

interface Props {}

export const Main: React.FC<Props> = () => {
  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <ProxyToggleButton />
      <RequestList />
    </>
  );
};
