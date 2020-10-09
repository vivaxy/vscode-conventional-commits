/**
 * @since 2020-10-09 16:59
 * @author vivaxy
 */
import * as vscode from 'vscode';
import createConventionalCommits from './lib/conventional-commits';
import * as output from './lib/output';
import * as localize from './lib/localize';

export function activate(context: vscode.ExtensionContext) {
  output.initialize();
  localize.initialize();
  output.appendLine('Activated');
  output.appendLine(
    'process.env.VSCODE_NLS_CONFIG: ' + process.env.VSCODE_NLS_CONFIG,
  );
  const disposable = vscode.commands.registerCommand(
    'extension.conventionalCommits',
    createConventionalCommits(),
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
