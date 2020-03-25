/**
 * @since 2020-03-25 09:08
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as VSCodeGit from '../vendors/git';
import prompts from './prompts';

function getGitAPI(): VSCodeGit.API | void {
  const vscodeGit = vscode.extensions.getExtension<VSCodeGit.GitExtension>(
    'vscode.git',
  );
  if (vscodeGit) {
    return vscodeGit.exports.getAPI(1);
  }
}

export default async function conventionalCommits() {
  const git = getGitAPI();
  if (!git) {
    vscode.window.showErrorMessage('vscode.git is not enabled');
    return;
  }
  const answers = await prompts();
  vscode.commands.executeCommand('workbench.view.scm');
  git.repositories.forEach(function (repo) {
    let message = '';
    message += answers.type.trim();
    if (answers.scope) {
      message += `(${answers.scope})`;
    }
    message += ': ';
    if (answers.gitmoji) {
      message += `${answers.gitmoji} `;
    }
    message += answers.subject.trim();
    message += '\n\n';
    message += answers.body.trim();
    message += '\n\n';
    message += answers.footer.trim();
    repo.inputBox.value = message;
  });
}
