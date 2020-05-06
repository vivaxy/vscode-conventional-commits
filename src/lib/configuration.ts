/**
 * @since 2020-03-25 09:21
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as names from '../configs/names';

export type Configuration = {
  autoCommit: boolean;
  gitmoji: boolean;
  scopes: string[];
};

export function getConfiguration() {
  return vscode.workspace.getConfiguration();
}

export function get<T>(key: keyof Configuration): T {
  return (getConfiguration().get<Configuration>(
    `${names.conventionalCommits}.${key}`,
  ) as unknown) as T;
}

export async function update(key: keyof Configuration, value: any) {
  return await vscode.workspace
    .getConfiguration()
    .update(`${names.conventionalCommits}.${key}`, value);
}
