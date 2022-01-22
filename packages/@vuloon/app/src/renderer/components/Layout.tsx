import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const Layout: React.VFC<Props> = ({ children }) => {
  return <>{children}</>;
};
