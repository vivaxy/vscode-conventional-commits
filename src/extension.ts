import * as vscode from 'vscode';
import conventionalCommits from './lib/conventional-commits';
import * as output from './lib/output';
import * as names from './configs/names';

export function activate(context: vscode.ExtensionContext) {
  output.initialize();
  output.appendLine(`${names.conventionalCommits} started`);
  const disposable = vscode.commands.registerCommand(
    'extension.conventionalCommits',
    conventionalCommits,
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
