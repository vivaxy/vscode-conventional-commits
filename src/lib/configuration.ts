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

export enum BREAKING_CHANGE_FORMAT {
  hyphen = 'hyphen',
  space = 'space',
  both = 'both',
}

export type Configuration = {
  autoCommit: boolean;
  gitmoji: boolean;
  emojiFormat: EMOJI_FORMAT;
  showEditor: boolean;
  scopes: string[];
  lineBreak: string;
  promptScopes: boolean;
  promptBody: boolean;
  promptFooter: boolean;
  showNewVersionNotes: boolean;
  'editor.keepAfterSave': boolean;
  detectBreakingChange: boolean;
  promptBreakingChange: boolean;
  breakingChangeFormat: BREAKING_CHANGE_FORMAT;
};

export function getConfiguration() {
  return vscode.workspace.getConfiguration();
}

export function get<T>(key: keyof Configuration): T {
  return (getConfiguration().get<Configuration>(
    `${keys.PREFIX}.${key}`,
  ) as unknown) as T;
}

export async function update(
  key: keyof Configuration,
  value: any,
  configurationTarget?: boolean,
) {
  return await vscode.workspace
    .getConfiguration()
    .update(`${keys.PREFIX}.${key}`, value, configurationTarget);
}
