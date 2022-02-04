import { useI18nTranslate } from '@/renderer/components/hooks/useI18n';
import { Box, Typography } from '@mui/material';
import React from 'react';

export const Welcome: React.VFC = () => {
  const t = useI18nTranslate(dict);

  return (
    <Box>
      <Typography component="h1" variant="h4">
        {t('title')}
      </Typography>
    </Box>
  );
};

const dict = {
  jp: {
    title: 'Welcome!!',
  },
  en: {
    title: 'Welcome!!',
  },
};
