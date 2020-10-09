/**
 * @since 2020-10-09 15:46
 * @author vivaxy
 */
import * as path from 'path';

let defaultNLS: Record<string, string> = {};
let localeNLS: Record<string, string> = {};

export function initialize() {
  defaultNLS = getNLS();
  const config = JSON.parse(process.env.VSCODE_NLS_CONFIG!);
  localeNLS = getNLS(config.locale);
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
