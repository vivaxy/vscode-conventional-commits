import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';

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
 * Simplified file provider for handling Git commit messages.
 */
const CommitProvider = new (class implements vscode.FileSystemProvider {
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this
    ._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    return new vscode.Disposable(async () => {
      const autoCommit = configuration.get<boolean>('autoCommit');
      const keepAfterSave = configuration.get<boolean>('editor.keepAfterSave');
      output.info('The commit message tab has been disposed.');
      if (state.repository) {
        const value = state.repository.inputBox.value;
        output.info(`finally inputBox.value:\n${value}`);
        if (keepAfterSave) {
          await vscode.commands.executeCommand('workbench.view.scm');
          if (autoCommit) {
            await vscode.commands.executeCommand(
              'git.commit',
              state.repository,
            );
            output.info('Auto commit finished successfully.');
          }
        }
      } else {
        output.warning('provider: state.repository not found!');
        output.info(`state: ${state}`);
      }
    });
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
    return new Promise(
      async (resolve): Promise<void> => {
        try {
          const autoCommit = configuration.get<boolean>('autoCommit');
          const keepAfterSave = configuration.get<boolean>(
            'editor.keepAfterSave',
          );
          const value = new TextDecoder().decode(content);
          if (state.repository) {
            state.repository.inputBox.value = value;
            output.info('Sync commit message successfully.');
            if (!keepAfterSave) {
              vscode.commands.executeCommand(
                'workbench.action.revertAndCloseActiveEditor',
              );
              if (autoCommit) {
                await vscode.commands.executeCommand('workbench.view.scm');
                await vscode.commands.executeCommand(
                  'git.commit',
                  state.repository,
                );
                output.info('Auto commit finished successfully.');
              }
            }
            resolve();
          }
        } catch (e) {
          output.error('writeFile', e as Error);
        }
      },
    );
  }

  rename(): void {}

  delete(): void {}
})();

export default CommitProvider;
