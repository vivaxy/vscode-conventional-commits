/**
 * @since 2020-10-09 16:59
 * @author vivaxy
 */
import * as vscode from 'vscode';
import createConventionalCommits from './lib/conventional-commits';
import * as output from './lib/output';
import localize, {
  getSourcesLocalize,
  initialize as localizeInitialize,
} from './lib/localize';
import CommitProvider from './lib/editor/provider';
import { ID } from './configs/keys';

export async function activate(context: vscode.ExtensionContext) {
  output.initialize();
  output.info('Extension Activated');
  localizeInitialize();
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.conventionalCommits',
      createConventionalCommits(),
    ),
    vscode.commands.registerCommand(
      'extension.conventionalCommits.resetGlobalState',
      () => {
        context.globalState.update('version', '0.0.0');
        const title = localize('extension.name');
        const message = getSourcesLocalize('resetMessage');
        vscode.window.showInformationMessage(`${title}: ${message}`);
      },
    ),
    vscode.commands.registerCommand(
      'extension.conventionalCommits.showNewVersionNotes',
      () => output.showNewVersionNotes(ID, context, true),
    ),
  );
  output.showNewVersionNotes(ID, context);
  vscode.workspace.registerFileSystemProvider('commit-message', CommitProvider);
}

export function deactivate() {}
