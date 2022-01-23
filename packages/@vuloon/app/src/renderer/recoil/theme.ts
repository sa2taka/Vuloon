import { Theme, themes } from '@/main/domain/entities/theme';
import { selector, useRecoilValue } from 'recoil';
import { configState } from '@/renderer/recoil/config';

export const themeState = selector<Theme>({
  key: 'vuloon:theme',
  get: ({ get }) => {
    const { theme } = get(configState);
    return themes[theme];
  },
});

export const useTheme = (): Theme => {
  return useRecoilValue(themeState);
};
