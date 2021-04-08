/**
 * @since 2020-03-27 08:00
 * @author vivaxy
 */
import * as vscode from 'vscode';
import localize from './localize';
import * as configuration from './configuration';

let output: vscode.OutputChannel;

export function initialize() {
  output = vscode.window.createOutputChannel('Conventional Commits');
}

export function appendLine(message: string) {
  output.appendLine(message);
}

export function info(message: string) {
  appendLine('[info] ' + message);
}

export function warning(message: string) {
  appendLine('[warning] ' + message);
}

// give error or message of the custom error
export function error(
  functionName: string,
  arg: string | Error,
  isBreaking?: boolean,
) {
  const message = typeof arg === 'string' ? arg : arg.stack;
  appendLine(`[error] ${functionName}: ${message}`);

  const title = localize('extension.name');
  const body = typeof arg === 'string' ? arg : arg.message;
  vscode.window.showErrorMessage(`${title}: ${body}`);
  if (isBreaking) throw new Error('custom breaking error has been catch!');
}

export function extensionPackageJSON(id: string) {
  const packageJSON = vscode.extensions.getExtension(id)?.packageJSON;
  if (packageJSON === undefined) {
    error('outputExtensionVersion', `Extension ${id} not found!`, true);
  }
  return packageJSON;
}

export function extensionVersion(name: string, id: string) {
  const packageJSON = extensionPackageJSON(id);
  info(`${name} version: ${packageJSON.version}`);
}

export function extensionConfiguration(id: string) {
  const packageJSON = extensionPackageJSON(id);
  for (let key in packageJSON.contributes.configuration.properties) {
    let value = configuration.getConfiguration().get(key);
    info(`${key}: ${value}`);
  }
}

export function relatedExtensionConfiguration(key: string) {
  info(`${key}: ${configuration.getConfiguration().get(key)}`);
}
