import { Container } from '@mui/material';
import React, { Suspense } from 'react';

interface Props {
  children: React.ReactNode;
}

export const Layout: React.VFC<Props> = ({ children }) => {
  return (
    <Suspense fallback={'loading'}>
      <Container>{children}</Container>
    </Suspense>
  );
};
