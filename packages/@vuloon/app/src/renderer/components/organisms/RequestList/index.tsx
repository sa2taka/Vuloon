import { Table, TableBody, TableCell, TableContainer, TableHead } from '@mui/material';
import React from 'react';
import { useRequests } from '../../hooks/exchangerHooks/useRequests';

interface Props {}

export const RequestList: React.VFC<Props> = () => {
  const requests = useRequests();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableCell>HOST</TableCell>
          <TableCell>path</TableCell>
        </TableHead>
        {requests.map((request) => (
          <TableBody key={request.proxyIssuedId}>
            <TableCell>{request.request.request.header.headers.host}</TableCell>
            <TableCell>{request.request.request.header.url}</TableCell>
          </TableBody>
        ))}
      </Table>
    </TableContainer>
  );
};
