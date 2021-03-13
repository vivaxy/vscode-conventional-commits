/**
 * @since 2020-10-09 15:46
 * @author vivaxy
 */
import { extensions, env, window } from 'vscode';
import { appendLine } from './output';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const DEFAULT_LOCALE = 'en';

export const rootPath = getRoot('vivaxy.vscode-conventional-commits');

function getRoot(name: string) {
  const extension = extensions.getExtension(name);
  if (extension) return extension.extensionPath;
  else {
    window.showErrorMessage(
      `undefined: ENOENT: no such extension, getExtension(${name})`,
    );
    return resolve(__dirname, '../');
  }
}

export let locale: string = DEFAULT_LOCALE;
let localeNLS: Record<string, string> = {};
let defaultNLS: Record<string, string> = {};

function getLocale() {
  const language = env.language;
  appendLine('vscode.env.language: ' + language);
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
    appendLine(
      `[warning] localize: Missing translation for ${key}, try to use default localization.`,
    );
    if (defaultNLS[key]) return defaultNLS[key];
    else {
      window.showErrorMessage(
        `[error] localize: Missing default translation for ${key}.`,
      );
      return `Missing default translation for ${key}.`;
    }
  }
}

function getNLS(locale: string = '') {
  const suffix = (locale && `.${locale}`) ?? '';
  let content = '';
  try {
    content = readFileSync(
      resolve(rootPath, `package.nls${suffix}.json`),
      'utf-8',
    );
  } catch (e) {
    if (e.message.includes('ENOENT: no such file or directory')) {
      appendLine(`[warning] getNLS: Missing translation for ${locale}`);
    } else window.showErrorMessage(`[error] getNLS: ${e}`);
    content = readFileSync(resolve(rootPath, `package.nls.json`), 'utf-8');
  } finally {
    return JSON.parse(content);
  }
}
