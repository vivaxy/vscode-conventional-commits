import * as vscode from 'vscode';
import createConventionalCommits from './lib/conventional-commits';
import * as output from './lib/output';

export function activate(context: vscode.ExtensionContext) {
  output.initialize();
  output.appendLine('Activated');
  const disposable = vscode.commands.registerCommand(
    'extension.conventionalCommits',
    createConventionalCommits(),
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
