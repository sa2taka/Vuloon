import { getProxy, startProxy, stopProxy } from '@/renderer/domain/models/proxy';
import { Proxy } from '@vuloon/proxy';
import { atom, selector } from 'recoil';

export const proxyEnableAtom = atom<boolean>({
  key: 'proxyEnable',
  default: false,
});

export const proxyEnableState = selector<boolean>({
  key: 'proxy',
  get: ({ get }) => {
    return get(proxyEnableAtom);
  },
  set: async ({ get, set }, newValue) => {
    const currentState = get(proxyEnableAtom);

    if (currentState === newValue) {
      return;
    }

    if (newValue) {
      await startProxy();
    } else {
      await stopProxy();
    }

    set(proxyEnableAtom, newValue);
  },
});

export const proxyState = selector<Proxy>({
  key: 'proxy',
  get: () => {
    return getProxy();
  },
});
