import { Container } from '@mui/material';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const Layout: React.VFC<Props> = ({ children }) => {
  return <Container>{children}</Container>;
};
