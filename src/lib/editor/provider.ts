import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import localize from '../localize';
import { Repository } from '../../vendors/git';
import * as configuration from '../configuration';
import * as output from '../output';

interface State {
  repository?: Repository;
}

export const state: State = {
  repository: undefined,
};

/**
 * Simplified provider for handling Git commit messages.
 * On save, the contents are instead autocommited or used to update repository object (depending on settings).
 */
const CommitProvider = new (class implements vscode.FileSystemProvider {
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this
    ._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  stat(): vscode.FileStat {
    return {
      type: vscode.FileType.File,
      ctime: Date.now(),
      mtime: Date.now(),
      size: 0,
    };
  }

  readDirectory() {
    return [];
  }

  readFile(_uri: vscode.Uri): Uint8Array {
    const enc = new TextEncoder();
    return enc.encode(state.repository?.inputBox.value);
  }

  createDirectory(): void {}
  writeFile(_uri: vscode.Uri, content: Uint8Array): Thenable<void> {
    return new Promise(async (resolve) => {
      try {
        const value = new TextDecoder().decode(content);

        if (state.repository) {
          const autoCommit = configuration.get<boolean>('autoCommit');
          state.repository.inputBox.value = value;
          vscode.commands.executeCommand(
            'workbench.action.revertAndCloseActiveEditor',
          );

          if (autoCommit) {
            await vscode.commands.executeCommand(
              'git.commit',
              state.repository,
            );
            resolve();
          } else {
            await vscode.commands.executeCommand('workbench.view.scm');
            resolve();
          }

          output.appendLine('Finished successfully.');
        }
      } catch (e) {
        output.appendLine(`Finished with an error: ${e.stack}`);
        vscode.window.showErrorMessage(
          `${localize('extension.name')}: ${e.message}`,
        );
      }
    });
  }
  rename(): void {}
  delete(): void {}
})();

export default CommitProvider;
