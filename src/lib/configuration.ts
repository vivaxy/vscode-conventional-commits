/**
 * @since 2020-03-25 09:21
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as names from '../configs/names';

export type Configuration = {
  autoCommit: boolean;
  gitmoji: boolean;
};

export default function getConfiguration(): Configuration {
  const config = vscode.workspace
    .getConfiguration()
    .get<Configuration>(names.conventionalCommits);
  return config!;
}
