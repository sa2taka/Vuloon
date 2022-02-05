import { Button, CircularProgress } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useI18nTranslate } from '@/renderer/components/hooks/useI18n';
import { setCertificate } from '../../../domain/models/proxy';

export const SetProxyRootCertificateButton: React.VFC = () => {
  const t = useI18nTranslate(dict);
  const [enable, setEnable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorTextKey, setErrorTextKey] = useState<string | undefined>(undefined);

  const handleClick = useCallback(async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      await setCertificate();
      setEnable(false);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      if (e instanceof Error) {
        setErrorTextKey(e.message);
      }
      if (typeof e === 'string') {
        setErrorTextKey(e);
      }
    }
  }, [loading, setLoading, setEnable]);

  return (
    <Button onClick={handleClick} variant="contained" disabled={!enable} sx={{ width: '200px' }}>
      {loading ? <CircularProgress sx={{ color: 'white' }} size="1.7em" /> : t('set-certificate')}
    </Button>
  );
};

const dict = {
  ja: {
    'set-certificate': 'ルート証明書を登録する',
  },
  en: {
    'set-certificate': 'set root certificate',
  },
};
