import { TableBody, TableCell } from '@mui/material';
import React, { useMemo } from 'react';

interface Props {
  method: string | undefined;
  path: string | undefined;
  host: string | undefined;
  statusCode: number | undefined;
}

export const RequestListRow: React.VFC<Props> = ({ method, path, host, statusCode }) => {
  const displayedMethod = useMemo(() => method ?? '', [method]);
  const displayedPath = useMemo(() => {
    try {
      return new URL(path ?? '').pathname;
    } catch {
      return new URL(path ?? '', `https://${host}`).pathname;
    }
  }, [path, host]);
  const displayedHost = useMemo(() => host ?? '', [host]);
  const displayedStatusCode = useMemo(() => statusCode?.toString() ?? '', [statusCode]);

  return (
    <TableBody>
      <TableCell>{displayedMethod}</TableCell>
      <TableCell>{displayedHost}</TableCell>
      <TableCell>{displayedPath}</TableCell>
      <TableCell>{displayedStatusCode}</TableCell>
    </TableBody>
  );
};
