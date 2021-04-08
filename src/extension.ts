/**
 * @since 2020-10-09 16:59
 * @author vivaxy
 */
import * as vscode from 'vscode';
import createConventionalCommits from './lib/conventional-commits';
import * as output from './lib/output';
import * as localize from './lib/localize';
import CommitProvider from './lib/editor/provider';
import { ID } from './configs/keys';

export async function activate(context: vscode.ExtensionContext) {
  output.initialize();
  output.info('Extension Activated');
  localize.initialize();
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.conventionalCommits',
      createConventionalCommits(),
    ),
  );
  output.showNewVersionNotes(ID, context);
  vscode.workspace.registerFileSystemProvider('commit-message', CommitProvider);
}

export function deactivate() {}
