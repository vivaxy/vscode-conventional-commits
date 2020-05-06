/**
 * @since 2020-03-25 09:08
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as VSCodeGit from '../vendors/git';
import prompts, { Answers } from './prompts';
import * as configuration from './configuration';
import * as names from '../configs/names';
import * as output from './output';
import * as commitlint from './commitlint';

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

export default function createConventionalCommits() {
  return async function conventionalCommits() {
    try {
      const git = getGitAPI();
      if (!git) {
        throw new Error('vscode.git is not enabled.');
      }
      const { rootPath } = vscode.workspace;
      if (!rootPath) {
        throw new Error('Please open a folder.');
      }
      const commlintRules = await commitlint.getRules({ cwd: rootPath });
      const answers = await prompts({
        gitmoji: configuration.get<boolean>('gitmoji'),
        commlintRules,
      });
      output.appendLine(`answers: ${(JSON.stringify(answers), null, 2)}`);
      const commitMessage = formatAnswers(answers);
      output.appendLine(`commitMessage: ${commitMessage}`);
      vscode.commands.executeCommand('workbench.view.scm');
      const [repo] = git.repositories
        .filter(function (repo) {
          return rootPath.startsWith(repo.rootUri.fsPath);
        })
        .sort(function (prev, next) {
          return next.rootUri.fsPath.length - prev.rootUri.fsPath.length;
        });
      if (!repo) {
        throw new Error(`repo not found in path: ${rootPath}`);
      }
      output.appendLine(`repo: ${JSON.stringify(repo)}`);
      repo.inputBox.value = commitMessage;
      const autoCommit = configuration.get<boolean>('autoCommit');
      output.appendLine(`autoCommit: ${autoCommit}`);
      if (autoCommit) {
        await vscode.commands.executeCommand('git.commit');
      }
    } catch (e) {
      output.appendLine(`error: ${e.stack}`);
      vscode.window.showErrorMessage(
        `${names.Conventional_Commits}: ${e.message}`,
      );
    }
  };
}
