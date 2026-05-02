import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.karigori.pathsala',
  appName: 'Karigori Pathsala',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
