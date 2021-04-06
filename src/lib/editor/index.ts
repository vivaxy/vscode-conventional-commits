/**
 * @since 2021-01-29 11:09
 * @author sbacic
 */

import * as vscode from 'vscode';
import * as VSCodeGit from '../../vendors/git';
import { state } from './provider';

/**
 * Opens a new empty file and adds the commit message.
 * The language mode is set to "Git Commit Message" and
 * the FileSystemProvider is set to CommitProvider.
 * @param repository The project repository.
 */
export default async function openMessageInTab(
  repository: VSCodeGit.Repository,
) {
  state.repository = repository;
  const uri = vscode.Uri.file('COMMIT_EDITMSG').with({
    scheme: 'commit-message',
  });
  await vscode.commands.executeCommand('vscode.open', uri);
}
