/**
 * @since 2020-03-25 09:08
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as VSCodeGit from '../vendors/git';
import prompts, { Answers } from './prompts';
import getConfiguration from './configuration';
import * as names from '../configs/names';
import * as output from './output';

function getGitAPI(): VSCodeGit.API | void {
  const vscodeGit = vscode.extensions.getExtension<VSCodeGit.GitExtension>(
    'vscode.git',
  );
  if (vscodeGit) {
    return vscodeGit.exports.getAPI(1);
  }
}

function formatAnswers(answers: Answers) {
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
  return message;
}

export default async function conventionalCommits() {
  try {
    const git = getGitAPI();
    if (!git) {
      throw new Error('vscode.git is not enabled');
    }
    const answers = await prompts();
    const commitMessage = formatAnswers(answers);
    const configuration = getConfiguration();
    vscode.commands.executeCommand('workbench.view.scm');
    // TODO: find current working directory
    const repo = git.repositories.find(function (repo) {
      return repo.rootUri.fsPath === vscode.workspace.rootPath;
    });
    if (!repo) {
      throw new Error(`repo not found in path: ${vscode.workspace.rootPath}`);
    }
    repo.inputBox.value = commitMessage;
    output.appendLine(`autoCommit: ${configuration.autoCommit}`);
    if (configuration.autoCommit) {
      await vscode.commands.executeCommand('git.commit');
    }
  } catch (e) {
    vscode.window.showErrorMessage(
      `${names.Conventional_Commits}: ${e.message}`,
    );
  }
}
