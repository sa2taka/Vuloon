import { FormControlLabel, Switch } from '@mui/material';
import React, { Suspense, useCallback } from 'react';
import { proxyEnableState } from '../../../recoil/proxy';
import { useRecoilState } from 'recoil';

interface Props {}

const ToggleButton: React.VFC<{
  value?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  isLoading?: boolean;
}> = ({ value, onChange, isLoading = false }) => (
  <FormControlLabel control={<Switch checked={value} onChange={onChange} disabled={isLoading} />} label="Proxy" />
);

const ProxyInjection: React.VFC = () => {
  const [proxyEnable, setProxyEnable] = useRecoilState(proxyEnableState);
  const onChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setProxyEnable(checked);
    },
    [setProxyEnable]
  );

  return <ToggleButton value={proxyEnable} onChange={onChange} />;
};

export const ProxyToggleButton: React.VFC<Props> = () => {
  return (
    <Suspense fallback={<ToggleButton isLoading={true} />}>
      <ProxyInjection />
    </Suspense>
  );
};
