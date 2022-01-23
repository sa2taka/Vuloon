import { DefaultValue } from 'recoil';

export const isDefaultValue = (value: any): value is DefaultValue => {
  return '__tag' in value;
};
