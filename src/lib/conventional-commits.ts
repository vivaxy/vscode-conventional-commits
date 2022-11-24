/**
 * @since 2020-03-25 09:08
 * @author vivaxy
 */
import * as path from 'path';
import * as vscode from 'vscode';
import * as VSCodeGit from '../vendors/git';
import prompts from './prompts';
import * as configuration from './configuration';
import * as output from './output';
import commitlint from './commitlint';
import createSimpleQuickPick from './prompts/quick-pick';
import { serialize } from './commit-message';
import { getSourcesLocalize } from './localize';
import openMessageInTab from './editor';
import { ID } from '../configs/keys';

function getGitAPI(): VSCodeGit.API {
  const vscodeGit = vscode.extensions.getExtension('vscode.git');
  if (!vscodeGit?.exports.getAPI(1)) {
    output.error('getGitAPI', getSourcesLocalize('vscodeGitNotFound'), true);
  }
  return vscodeGit!.exports.getAPI(1);
}

type Arg = {
  _rootUri?: vscode.Uri;
};

function hasChanges(repo: VSCodeGit.Repository) {
  return (
    repo.state.workingTreeChanges.length ||
    repo.state.mergeChanges.length ||
    repo.state.indexChanges.length
  );
}

async function getRepository({
  git,
  arg,
  workspaceFolders,
}: {
  git: VSCodeGit.API;
  arg?: Arg;
  workspaceFolders?: readonly vscode.WorkspaceFolder[];
}) {
  const _arg = arg?._rootUri?.fsPath;
  output.info(`arg: ${_arg}`);

  const repositories = git.repositories
    .map((repo) => repo.rootUri.fsPath)
    .join(', ');
  output.info(`git.repositories: ${repositories}`);

  const _workspaceFolders = workspaceFolders
    ?.map((folder) => folder.uri.fsPath)
    .join(', ');
  output.info(`workspaceFolders: ${_workspaceFolders}`);

  if (_arg) {
    const repo = git.repositories.find(function (r) {
      return r.rootUri.fsPath === _arg;
    });
    if (repo) return repo;
    else {
      output.error(
        'getRepository',
        getSourcesLocalize('repositoryNotFoundInPath') + _arg,
        true,
      );
    }
  }

  if (git.repositories.length === 0) {
    output.error(
      'getRepository',
      getSourcesLocalize('repositoriesEmpty'),
      true,
    );
  }

  if (git.repositories.length === 1) return git.repositories[0];

  const items = git.repositories.map(function (repo, index) {
    const folder = workspaceFolders?.find(function (f) {
      return f.uri.fsPath === repo.rootUri.fsPath;
    });
    return {
      index,
      label: folder?.name || path.basename(repo.rootUri.fsPath),
      description:
        (repo.state.HEAD?.name || repo.state.HEAD?.commit?.slice(0, 8) || '') +
        (hasChanges(repo) ? '*' : ''),
    };
  });

  const [{ index }] = (
    await createSimpleQuickPick({
      placeholder: getSourcesLocalize('promptRepositoryPlaceholder'),
      items,
    })
  ).activeItems;

  return git.repositories[index];
}

export default function createConventionalCommits() {
  return async function conventionalCommits(arg?: Arg) {
    try {
      output.info('Conventional commits started.');

      // 1. output basic information
      output.info(`VSCode version: ${vscode.version}`);
      output.extensionVersion('Git', 'vscode.git');

      output.extensionVersion('VSCode Conventional Commits', ID);
      output.extensionConfiguration(ID);

      output.relatedExtensionConfiguration('git.enableSmartCommit');
      output.relatedExtensionConfiguration('git.smartCommitChanges');
      output.relatedExtensionConfiguration('git.postCommitCommand');

      // 2. check git
      const git = getGitAPI();

      // 3. get repository
      const repository = await getRepository({
        arg,
        git: git,
        workspaceFolders: vscode.workspace.workspaceFolders,
      });

      // 4. get commitlint rules
      const commitlintRuleConfigs = await commitlint.loadRuleConfigs(
        repository.rootUri.fsPath,
      );
      output.info(
        `commitlintRuleConfigs:\n${JSON.stringify(
          commitlintRuleConfigs,
          null,
          2,
        )}`,
      );

      // 5. get message
      const commitMessage = await prompts({
        gitmoji: configuration.get<boolean>('gitmoji'),
        showEditor: configuration.get<boolean>('showEditor'),
        emojiFormat: configuration.get<configuration.EMOJI_FORMAT>(
          'emojiFormat',
        ),
        lineBreak: configuration.get<string>('lineBreak'),
        promptScopes: configuration.get<boolean>('promptScopes'),
        promptBody: configuration.get<boolean>('promptBody'),
        promptFooter: configuration.get<boolean>('promptFooter'),
        promptCI: configuration.get<boolean>('promptCI'),
      });
      output.info(`messageJSON:\n${JSON.stringify(commitMessage, null, 2)}`);
      const message = serialize(commitMessage);
      output.info(`message:\n${message}`);

      // 6. switch to scm and put message into message box
      // or show the entire commit message in a separate tab
      const showEditor = configuration.get<boolean>('showEditor');
      const silentAutoCommit = configuration.get<boolean>('silentAutoCommit');
      if (showEditor) {
        repository.inputBox.value = message;
        await openMessageInTab(repository);
        output.info('Show full commit message in a separate tab successfully.');
      } else {
        if (!silentAutoCommit) {
          vscode.commands.executeCommand('workbench.view.scm');
        }
        repository.inputBox.value = message;
        output.info(`inputBox.value:\n${repository.inputBox.value}`);
      }

      // 7. auto commit
      const autoCommit = configuration.get<boolean>('autoCommit');
      if (autoCommit && !showEditor) {
        await vscode.commands.executeCommand('git.commit', repository);
        output.info('Auto commit finished successfully.');
      }

      output.info('conventionalCommits finished successfully.');
    } catch (e) {
      // Ignore if the custom error message
      if (e.message === 'custom breaking error has been catch!') {
        output.info('conventionalCommits finished with custom error.');
      } else output.error('main', e);
    }
  };
}
