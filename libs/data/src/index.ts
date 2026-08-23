import configJson from './config.json';
import defaultTemplatesJson from './defaultTemplates.json';

export interface AppConfig {
  [key: string]: any;
}

export interface DefaultTemplates {
  [key: string]: any;
}

export const config: AppConfig = configJson;
export const defaultTemplates: DefaultTemplates = defaultTemplatesJson;

export default {
  config,
  defaultTemplates,
};
