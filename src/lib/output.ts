/**
 * @since 2020-03-27 08:00
 * @author vivaxy
 */
import * as vscode from 'vscode';

let output: vscode.OutputChannel;

export function initialize() {
  output = vscode.window.createOutputChannel('Conventional Commits');
}

export function appendLine(message: string) {
  output.appendLine(message);
}
