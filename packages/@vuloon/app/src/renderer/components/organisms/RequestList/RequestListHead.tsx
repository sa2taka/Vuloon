import { TableCell, TableHead } from '@mui/material';
import React from 'react';

interface Props {}

export const RequestListHead: React.VFC<Props> = () => {
  return (
    <TableHead>
      <TableCell>Method</TableCell>
      <TableCell>Host</TableCell>
      <TableCell>Path</TableCell>
      <TableCell>Status</TableCell>
    </TableHead>
  );
};
