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

function outputExtensionVersion(name: string, key: string) {
  output.appendLine(
    `${name} version: ${
      vscode.extensions.getExtension(key)?.packageJSON.version
    }`,
  );
}

function outputConfiguration(key: keyof configuration.Configuration) {
  output.appendLine(`${key}: ${configuration.get(key)}`);
}

function outputRelatedExtensionConfigutation(key: string) {
  output.appendLine(`${key}: ${configuration.getConfiguration().get(key)}`);
}

type Arg = {
  _rootUri: vscode.Uri;
  _inputBox: VSCodeGit.InputBox;
};

function getInputBox(arg: Arg, git: VSCodeGit.API) {
  if (arg && arg._inputBox) {
    return arg._inputBox;
  }

  if (git.repositories.length === 1) {
    return git.repositories[0].inputBox;
  }

  git.repositories
    // .filter(function (repo) {
    //   return repo.ui.selected && repo.state.workingTreeChanges.length;
    // })
    .map(function (repo) {
      return {
        path: repo.rootUri.path,
        branch: repo.state.HEAD?.name,
      };
    });

  // Choose a repository
}

export default function createConventionalCommits() {
  return async function conventionalCommits(arg?: Arg) {
    try {
      output.appendLine('Started');

      // 1. output basic information
      output.appendLine('arg: ' + arg?._rootUri.fsPath);
      output.appendLine(`VSCode version: ${vscode.version}`);

      outputExtensionVersion(
        'VSCode Conventional Commits',
        'vivaxy.vscode-conventional-commits',
      );
      outputExtensionVersion('Git', 'vscode.git');

      outputConfiguration('autoCommit');
      outputConfiguration('gitmoji');
      outputConfiguration('scopes');
      outputConfiguration('lineBreak');

      outputRelatedExtensionConfigutation('git.enableSmartCommit');
      outputRelatedExtensionConfigutation('git.smartCommitChanges');
      outputRelatedExtensionConfigutation('git.postCommitCommand');

      // 2. check git
      const git = getGitAPI();
      if (!git) {
        throw new Error('vscode.git is not enabled.');
      }

      // 3. get repository
      const { workspaceFolders, rootPath } = vscode.workspace;
      output.appendLine(`rootPath: ${rootPath}`);
      output.appendLine(
        `workspaceFolders: ${workspaceFolders
          ?.map(function ({ uri }) {
            return uri.fsPath;
          })
          .join('')}`,
      );
      if (!rootPath) {
        throw new Error('Please open a folder.');
      }

      // 4. get commitlint rules
      const commlintRules = await commitlint.getRules({ cwd: rootPath });
      output.appendLine(
        `commlintRules: ${JSON.stringify(commlintRules, null, 2)}`,
      );

      // 5. get message
      const answers = await prompts({
        gitmoji: configuration.get<boolean>('gitmoji'),
        commlintRules,
        lineBreak: configuration.get<string>('lineBreak'),
      });
      output.appendLine(`answers: ${JSON.stringify(answers, null, 2)}`);
      const commitMessage = formatAnswers(answers);
      output.appendLine(`commitMessage: ${commitMessage}`);

      // 6. get current repo inputBox
      const inputBox = getInputBox(arg, git);

      // 7. switch to scm and put message into message box
      vscode.commands.executeCommand('workbench.view.scm');
      inputBox && (inputBox.value = commitMessage);
      output.appendLine(`inputBox.value: ${inputBox?.value}`);

      // 8. auto commit
      const autoCommit = configuration.get<boolean>('autoCommit');
      if (autoCommit) {
        await vscode.commands.executeCommand('git.commit');
      }
      output.appendLine('Finished successfully.');
    } catch (e) {
      output.appendLine(`Finished with an error: ${e.stack}`);
      vscode.window.showErrorMessage(
        `${names.Conventional_Commits}: ${e.message}`,
      );
    }
  };
}
