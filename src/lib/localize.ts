/**
 * @since 2020-10-09 15:46
 * @author vivaxy
 */
import { extensions, env } from 'vscode';
import * as output from './output';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { ID } from '../configs/keys';

export const rootPath = getRoot(ID);

function getRoot(name: string) {
  const extension = extensions.getExtension(name);
  if (extension) return extension.extensionPath;
  else {
    // It does not have an output channel when activating the extension.
    return resolve(__dirname, '../');
  }
}

const DEFAULT_LOCALE = 'en';
export let locale: string = DEFAULT_LOCALE;

let localeNLS: Record<string, string> = {};
let defaultNLS: Record<string, string> = {};

function getLocale() {
  const language = env.language;
  output.info('vscode.env.language: ' + language);
  return language || DEFAULT_LOCALE;
}

export function initialize() {
  locale = getLocale();
  defaultNLS = getNLS();
  localeNLS = getNLS(locale);
}

export default function localize(key: string) {
  if (localeNLS[key]) return localeNLS[key];
  else {
    output.warning(
      `localize: Missing translation for ${key}, try to use default localization.`,
    );
    if (defaultNLS[key]) return defaultNLS[key];
    else {
      // Not break and return prompt message.
      output.error('localize', `Missing default translation for ${key}.`);
      return `Missing default translation for ${key}.`;
    }
  }
}

function getNLS(locale: string = '') {
  const packageName = `package.nls${(locale && `.${locale}`) ?? ''}.json`;
  let content = '';
  try {
    content = readFileSync(resolve(rootPath, packageName), 'utf-8');
  } catch (e) {
    if (!e.message.includes('ENOENT: no such file or directory')) {
      // Not break and try to use default package.nls.json
      output.error('getNLS', e);
    } else if (locale != 'en') {
      output.warning(`getNLS: Missing translation for ${locale}`);
    }
    content = readFileSync(resolve(rootPath, `package.nls.json`), 'utf-8');
  } finally {
    return JSON.parse(content);
  }
}

export function getPromptLocalize(key: string) {
  return localize(`extension.sources.prompt.${key}`);
}

export function getSourcesLocalize(key: string) {
  return localize(`extension.sources.${key}`);
}
