import { Config } from '@/domain/entities/config';
import { useLanguage } from '../../recoil/config';

const DEFAULT_LANGUAGE = 'en';

export const useI18nTranslate = <T extends Record<Config['language'], Record<keyof T[keyof T], string>>>(
  translationDictionary: T
): ((key: keyof T[keyof T]) => string) => {
  const language = useLanguage();

  return (key: keyof T[keyof T]) => {
    const mainCode = language.split('-')[0];
    return (
      translationDictionary[language][key] ??
      translationDictionary[mainCode][key] ??
      translationDictionary[DEFAULT_LANGUAGE][key] ??
      key
    );
  };
};
