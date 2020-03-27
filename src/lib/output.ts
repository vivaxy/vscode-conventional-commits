/**
 * @since 2020-03-27 08:00
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as names from '../configs/names';

let output: vscode.OutputChannel;

export function initialize() {
  output = vscode.window.createOutputChannel(names.Conventional_Commits);
}

export function appendLine(message: string) {
  output.appendLine(message);
}
