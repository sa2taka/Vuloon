import { RequestListHead } from '@/renderer/components/organisms/RequestList/RequestListHead';
import { RequestListRow } from '@/renderer/components/organisms/RequestList/RequestListRow';
import { Table, TableContainer } from '@mui/material';
import React from 'react';
import { useRequests } from '../../hooks/exchangerHooks/useRequests';

interface Props {}

export const RequestList: React.VFC<Props> = () => {
  const requests = useRequests();

  return (
    <TableContainer>
      <Table>
        <RequestListHead />
        {requests.map((request) => (
          <RequestListRow
            key={request.proxyIssuedId}
            method={request.request.request.header.method}
            host={request.request.request.header.headers.host}
            path={request.request.request.header.url}
            statusCode={request.response.response.header.statusCode}
          />
        ))}
      </Table>
    </TableContainer>
  );
};
