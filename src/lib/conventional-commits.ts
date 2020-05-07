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
      output.appendLine(`rootPath: ${rootPath}`);
      if (!rootPath) {
        throw new Error('Please open a folder.');
      }
      const commlintRules = await commitlint.getRules({ cwd: rootPath });
      output.appendLine(
        `commlintRules: ${JSON.stringify(commlintRules, null, 2)}`,
      );
      const answers = await prompts({
        gitmoji: configuration.get<boolean>('gitmoji'),
        commlintRules,
      });
      output.appendLine(`answers: ${JSON.stringify(answers, null, 2)}`);
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
      output.appendLine(
        `repo: ${JSON.stringify(
          {
            inputBox: {
              value: repo.inputBox.value,
            },
            rootUri: {
              authority: repo.rootUri.authority,
              fragment: repo.rootUri.fragment,
              fsPath: repo.rootUri.fsPath,
              path: repo.rootUri.path,
              query: repo.rootUri.query,
              scheme: repo.rootUri.scheme,
            },
            state: {
              HEAD: repo.state.HEAD,
              indexChanges: repo.state.indexChanges,
              mergeChanges: repo.state.mergeChanges,
              rebaseCommit: repo.state.rebaseCommit,
              refs: repo.state.refs,
              remotes: repo.state.remotes,
              submodules: repo.state.submodules,
              workingTreeChangesLength: `[...(${repo.state.workingTreeChanges.length})]`,
            },
          },
          null,
          2,
        )}`,
      );
      repo.inputBox.value = commitMessage;
      output.appendLine(`repo.inputBox.value: ${repo.inputBox.value}`);
      const autoCommit = configuration.get<boolean>('autoCommit');
      output.appendLine(`autoCommit: ${autoCommit}`);
      output.appendLine(
        `git.enableSmartCommit: ${configuration
          .getConfiguration()
          .get('git.enableSmartCommit')}`,
      );
      output.appendLine(
        `git.smartCommitChanges: ${configuration
          .getConfiguration()
          .get('git.smartCommitChanges')}`,
      );
      output.appendLine(
        `git.postCommitCommand: ${configuration
          .getConfiguration()
          .get('git.postCommitCommand')}`,
      );
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
