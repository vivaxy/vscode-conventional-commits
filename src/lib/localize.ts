/**
 * @since 2020-10-09 15:46
 * @author vivaxy
 */
import * as path from 'path';
import * as vscode from 'vscode';

import * as output from './output';

const DEFAULT_LOCALE = 'en';

export let locale: string = DEFAULT_LOCALE;
let defaultNLS: Record<string, string> = {};
let localeNLS: Record<string, string> = {};

function getLocale() {
  // const config = JSON.parse(process.env.VSCODE_NLS_CONFIG!);
  // return config.locale;
  const language = vscode.env.language;
  output.appendLine('vscode.env.language: ' + language);
  return language || DEFAULT_LOCALE;
}

export function initialize() {
  defaultNLS = getNLS();
  locale = getLocale();
  localeNLS = getNLS(locale);
}

export default function localize(key: string) {
  return localeNLS[key] || defaultNLS[key] || `Missing translation for ${key}`;
}

function getNLS(locale: string = '') {
  const ROOT = path.join(__dirname, '..', '..');
  try {
    const fileName = locale ? `package.nls.${locale}.json` : 'package.nls.json';
    return require(path.join(ROOT, fileName));
  } catch (e) {
    return {};
  }
}
