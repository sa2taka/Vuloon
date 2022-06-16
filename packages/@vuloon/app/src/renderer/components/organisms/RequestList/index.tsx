import { RequestListHead } from '@/renderer/components/organisms/RequestList/RequestListHead';
import { RequestListRow } from '@/renderer/components/organisms/RequestList/RequestListRow';
import { Table, TableContainer } from '@mui/material';
import React from 'react';
import { useRequests } from '../../hooks/exchangerHooks/useRequests';

interface Props {}

export const RequestList: React.VFC<Props> = () => {
  const exchangeDataList = useRequests();

  return (
    <TableContainer>
      <Table>
        <RequestListHead />
        {exchangeDataList.map((exchangeData) => (
          <RequestListRow
            key={exchangeData.proxyIssuedId}
            method={exchangeData.requestParameter.request.header.method}
            host={exchangeData.requestParameter.request.header.headers.host}
            path={exchangeData.requestParameter.request.header.url}
            statusCode={exchangeData.responseParameter.response.header.statusCode}
          />
        ))}
      </Table>
    </TableContainer>
  );
};
