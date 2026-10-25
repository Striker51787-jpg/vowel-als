// Metro resolves 'firebase/auth' to the React Native build at runtime, which exports
// getReactNativePersistence. TypeScript picks the web typings, so declare it here.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
