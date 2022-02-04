import { SetProxyRootCertificateButton } from '@/renderer/components/molecules/SetProxyRootCertificateButton';
import { Container, Typography } from '@mui/material';
import React from 'react';
import { useI18nTranslate } from '../../hooks/useI18n';

export const SetProxyRootCertificate: React.VFC = () => {
  const t = useI18nTranslate(dict);
  return (
    <Container>
      <Typography component="h1" variant="h4">
        {t('title')}
      </Typography>
      <Container sx={{ margin: '1em auto' }}>
        <Typography>{t('first')}</Typography>
        <Typography>{t('click-button-to-install')}</Typography>
      </Container>

      <Container>
        <SetProxyRootCertificateButton />
      </Container>
    </Container>
  );
};

const dict = {
  jp: {
    title: 'ルート証明書のインストール',
    first: '最初に、プロキシを正常に動作させるため、証明書をインストールする必要があります。',
    'click-button-to-install': '下記のボタンをクリックしてインストールしてください。',
  },
  en: {
    title: 'Install Root Certificate',
    first: 'First, you will need to install a certificate to make the proxy work.',
    'click-button-to-install': 'Click on the button below to install it.',
  },
};
