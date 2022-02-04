import { Button } from '@mui/material';
import React, { useCallback } from 'react';
import { useI18nTranslate } from '@/renderer/components/hooks/useI18n';
import { setCertificate } from '../../../domain/models/proxy';

export const SetProxyRootCertificateButton: React.VFC = () => {
  const t = useI18nTranslate(dict);
  const handleClick = useCallback(async () => {
    await setCertificate();
  }, []);

  return (
    <Button onClick={handleClick} variant="contained">
      {t('set-certificate')}
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
