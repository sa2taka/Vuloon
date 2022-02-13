import { requestExchanger } from '@/renderer/domain/exchanger/requestExchanger';

export const initialize = (): void => {
  requestExchanger.listen();
};
