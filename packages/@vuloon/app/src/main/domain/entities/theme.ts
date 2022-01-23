export const themeKeys = ['light', 'dark'] as const;

export type Theme = {
  foreground: string;
  background: string;
};

export const themes: { [key in typeof themeKeys[number]]: Theme } = {
  light: {
    foreground: '#000000',
    background: '#e0e0e0',
  },
  dark: {
    foreground: '#dddddd',
    background: '#24282c',
  },
};
