import { ElectronApi } from '../preload';

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}
