import { atom, selector, SetterOrUpdater, useRecoilState } from 'recoil';
import { Config } from '@/main/domain/entities/config';
import { ipcRenderer } from 'electron';
import { READ_CONFIG, WRITE_CONFIG } from '@/ipc/eventNames';

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
    return ipcRenderer.invoke(READ_CONFIG);
  },
  set: ({ set }, newValue) => {
    ipcRenderer.invoke(WRITE_CONFIG);
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
