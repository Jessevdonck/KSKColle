import config from 'config';
import packageJson from '../../package.json';

// 👇 1
export const ping = () => ({ pong: true });

// 👇 2
export const getVersion = () => ({
  env: config.get<string>('env'),
  version: packageJson.version,
  name: packageJson.name,
});