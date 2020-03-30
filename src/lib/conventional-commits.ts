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
  const scope = answers.scope.trim();
  if (scope) {
    message += `(${scope})`;
  }
  message += ': ';
  if (answers.gitmoji) {
    message += `${answers.gitmoji} `;
  }
  const subject = answers.subject.trim();
  if (subject) {
    message += subject;
  }
  const body = answers.body.trim();
  if (body) {
    message += `\n\n${body}`;
  }
  const footer = answers.footer.trim();
  if (footer) {
    message += `\n\n${footer}`;
  }
  return message;
}

export default async function conventionalCommits() {
  try {
    const git = getGitAPI();
    if (!git) {
      throw new Error('vscode.git is not enabled');
    }
    const configuration = getConfiguration();
    const answers = await prompts({ gitmoji: configuration.gitmoji });
    const commitMessage = formatAnswers(answers);
    vscode.commands.executeCommand('workbench.view.scm');
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
