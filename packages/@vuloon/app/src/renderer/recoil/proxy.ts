import { startProxy, stopProxy } from '@/renderer/domain/models/proxy';
import { atom, selector } from 'recoil';

export const proxyEnableAtom = atom<boolean>({
  key: 'vuloon:sproxyEnable',
  default: false,
});

export const proxyEnableState = selector<boolean>({
  key: 'vuloon:proxy',
  get: ({ get }) => {
    return get(proxyEnableAtom);
  },
  set: ({ get, set }, newValue) => {
    const currentState = get(proxyEnableAtom);

    if (currentState === newValue) {
      return;
    }

    if (newValue) {
      startProxy();
    } else {
      stopProxy();
    }

    set(proxyEnableAtom, newValue);
  },
});
