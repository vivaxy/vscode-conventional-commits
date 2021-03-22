/**
 * @since 2020-03-25 09:21
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as keys from '../configs/keys';

export enum EMOJI_FORMAT {
  code = 'code',
  emoji = 'emoji',
}

export type Configuration = {
  autoCommit: boolean;
  gitmoji: boolean;
  emojiFormat: EMOJI_FORMAT;
  showEditor: boolean;
  scopes: string[];
  lineBreak: string;
  promptScopes: boolean;
};

export function getConfiguration() {
  return vscode.workspace.getConfiguration();
}

export function get<T>(key: keyof Configuration): T {
  return (getConfiguration().get<Configuration>(
    `${keys.PREFIX}.${key}`,
  ) as unknown) as T;
}

export async function update(key: keyof Configuration, value: any) {
  return await vscode.workspace
    .getConfiguration()
    .update(`${keys.PREFIX}.${key}`, value);
}
