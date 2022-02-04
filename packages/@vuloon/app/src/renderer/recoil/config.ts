import { atom, selector, SetterOrUpdater, useRecoilState } from 'recoil';
import { Config } from '@/domain/entities/config';
import { isDefaultValue } from './util';
import { getConfig, setConfig } from '../domain/models/config';

const configAtom = atom<Config | null>({
  key: 'vuloon:config:atom',
  default: null,
});

export const configState = selector<Config>({
  key: 'vuloon:config',
  get: ({ get }) => {
    const atom = get(configAtom);
    if (atom) {
      return atom;
    }
    return getConfig();
  },
  set: ({ set }, newValue) => {
    if (!isDefaultValue(newValue)) {
      setConfig(newValue);
    }
    set(configAtom, newValue);
  },
});

export const useConfig = (): [Config, SetterOrUpdater<Config>] => {
  const [configAtomValue, setConfigAtom] = useRecoilState(configAtom);
  if (configAtomValue) {
    return useRecoilState(configState);
  }

  const [config, setConfig] = useRecoilState(configState);
  setConfigAtom(config);

  return [config, setConfig];
};
