import React, { useCallback, useMemo } from 'react';
import { Box, Button, Step, StepButton, Stepper, Typography } from '@mui/material';
import { useI18nTranslate } from '../hooks/useI18n';
import { Welcome } from '@/renderer/components/organisms/InitialSettings/Welcome';
import { SetProxyRootCertificate } from '../organisms/InitialSettings/SetProxyRootCertificate.stories';
import { completeInitial } from '../../domain/models/window';

export const InitialSetting: React.VFC = () => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completeStatuses, setCompleteStatuses] = React.useState<boolean[]>([false, false]);

  const t = useI18nTranslate(dict);

  const steps = useMemo(() => {
    return [
      {
        title: t('welcome-page-title'),
        component: Welcome,
      },
      {
        title: t('set-certificate-page-title'),
        component: SetProxyRootCertificate,
      },
    ];
  }, [t]);
  const active = useMemo(() => steps[activeStep], [steps, activeStep]);
  const totalSteps = useMemo(() => steps.length, [steps]);

  const isFirstStep = useMemo(() => activeStep === 0, [activeStep]);
  const isLastStep = useMemo(() => activeStep === totalSteps - 1, [activeStep, totalSteps]);

  const isBeforeAllCompleted = useCallback(
    (targetIndex: number) => completeStatuses.filter((_, index) => index < targetIndex).every((value) => value),
    [completeStatuses]
  );

  const handleStep = useCallback(
    (index: number) => {
      if (!isBeforeAllCompleted(index)) {
        return;
      }
      setActiveStep(index);
    },
    [isBeforeAllCompleted]
  );

  const handleNext = useCallback(() => {
    const newStatuses = completeStatuses.slice();
    newStatuses[activeStep] = true;
    setCompleteStatuses(newStatuses);

    if (!isLastStep) {
      setActiveStep(activeStep + 1);
    }
  }, [isLastStep, activeStep, setActiveStep, completeStatuses]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setActiveStep(activeStep - 1);
    }
  }, [isFirstStep, activeStep, setActiveStep]);

  const handleComplete = useCallback(() => {
    completeInitial();
  }, []);

  return (
    <Box marginTop="2em" marginX="3em">
      <Stepper nonLinear activeStep={activeStep}>
        {steps.map(({ title }, index) => (
          <Step key={title} completed={completeStatuses[index]}>
            <StepButton color="inherit" onClick={() => handleStep(index)}>
              {title}
            </StepButton>
          </Step>
        ))}
      </Stepper>

      <Box marginY="2em" marginX="1em">
        <active.component />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        {!isFirstStep && (
          <Button color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
        )}

        <Box sx={{ flex: '1 1 auto' }} />

        {isLastStep ? (
          <Button onClick={handleComplete}>{t('finish')}</Button>
        ) : (
          <Button onClick={handleNext} sx={{ mr: 1 }}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};

const dict = {
  ja: {
    'welcome-page-title': 'Welcome',
    'set-certificate-page-title': 'ルート証明書を登録する',
    finish: '完了',
  },
  en: {
    'welcome-page-title': 'Welcome',
    'set-certificate-page-title': 'set root certificate',
    finish: 'Finish',
  },
};
