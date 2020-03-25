import * as vscode from 'vscode';
import conventionalCommits from './lib/conventional-commits';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.conventionalCommits',
    conventionalCommits,
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
