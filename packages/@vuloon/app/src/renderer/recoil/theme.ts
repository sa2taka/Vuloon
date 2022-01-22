import { Theme, themes } from '@/domain/entities/theme';
import { selector, useRecoilValue } from 'recoil';
import { configState } from '@/renderer/recoil/config';

export const themeState = selector<Theme>({
  key: 'theme',
  get: ({ get }) => {
    const { theme } = get(configState);
    return themes[theme];
  },
});

export const useTheme = (): Theme => {
  return useRecoilValue(themeState);
};
