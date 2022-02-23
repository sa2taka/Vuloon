import { requestExchanger } from '@/renderer/domain/exchanger/requestExchanger';
import { uniqBy } from '@/uitils/list/uniq';
import { useEffect, useState } from 'react';
import { ProxyExchange } from '../../../domain/exchanger/requestExchanger';

export const useRequests = (): ProxyExchange[] => {
  const [requests, setRequests] = useState(requestExchanger.store);

  useEffect(() => {
    const unsubscribe = requestExchanger.register((event) => {
      setRequests((before) => uniqBy([event.detail].concat(before), 'proxyIssuedId'));
    });

    return unsubscribe;
  }, []);

  return requests;
};
