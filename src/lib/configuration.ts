/**
 * @since 2020-03-25 09:21
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as names from '../configs/names';

export type Configuration = {
  automaticOperations: 'none' | 'addAndCommit' | 'addCommitAndSync';
};

export function getConfiguration(): Configuration {
  const config = vscode.workspace
    .getConfiguration()
    .get<Configuration>(names.conventionalCommits);
  return config!;
}
