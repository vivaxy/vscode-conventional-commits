import * as vscode from 'vscode';
import * as VSCodeGit from './vendors/git';
import gitmojis from './vendors/gitmojis';
const conventionalCommitsTypes = require('conventional-commit-types');

function getGitAPI(): VSCodeGit.API | void {
  const vscodeGit = vscode.extensions.getExtension<VSCodeGit.GitExtension>(
    'vscode.git',
  );
  if (vscodeGit) {
    return vscodeGit.exports.getAPI(1);
  }
}

enum QUESTION_TYPES {
  QUICK_PICK,
  INPUT_BOX,
}

type Question = {
  type: QUESTION_TYPES;
  name: string;
  placeholder: string;
  items?: { label: string; detail: string; description: string }[];
  format?: (input: string) => string;
};

async function prompt() {
  const questions: Question[] = [
    {
      type: QUESTION_TYPES.QUICK_PICK,
      name: 'type',
      placeholder: "Select the type of change that you're committing",
      items: Object.keys(conventionalCommitsTypes.types).map(function (type) {
        const { title, description } = conventionalCommitsTypes.types[type];
        return {
          label: type,
          description: title,
          detail: description,
        };
      }),
    },
    {
      type: QUESTION_TYPES.INPUT_BOX,
      name: 'scope',
      placeholder: 'Denote the scope of this change',
    },
    {
      type: QUESTION_TYPES.QUICK_PICK,
      name: 'gitmoji',
      placeholder: 'Choose a gitmoji',
      items: [
        {
          label: 'none',
          description: '',
          detail: 'No gitmoji',
        },
        ...gitmojis.gitmojis.map(function ({ emoji, code, description }) {
          return {
            label: code,
            description: emoji,
            detail: description,
          };
        }),
      ],
      format(input) {
        if (input === 'none') {
          return '';
        }
        return input;
      },
    },
    {
      type: QUESTION_TYPES.INPUT_BOX,
      name: 'subject',
      placeholder: 'Write a short, imperative tense description of the change',
    },
    {
      type: QUESTION_TYPES.INPUT_BOX,
      name: 'body',
      placeholder: 'Provide a longer description of the change',
    },
    {
      type: QUESTION_TYPES.INPUT_BOX,
      name: 'footer',
      placeholder: 'List any breaking changes or issues closed by this change',
    },
  ];

  function createQuickPick({
    placeholder,
    items = [],
    format = (i) => i,
  }: Question) {
    return new Promise(function (resolve, reject) {
      const picker = vscode.window.createQuickPick();
      picker.placeholder = placeholder;
      picker.matchOnDescription = true;
      picker.matchOnDetail = true;
      picker.items = items;
      picker.show();
      picker.onDidAccept(function () {
        const result = format(picker.selectedItems[0].label);
        picker.dispose();
        resolve(result);
      });
    });
  }

  function createInputBox({ placeholder, format = (i) => i }: Question) {
    return new Promise(function (resolve, reject) {
      const input = vscode.window.createInputBox();
      input.placeholder = placeholder;
      input.onDidAccept(function () {
        const result = format(input.value);
        input.dispose();
        resolve(result);
      });
      input.prompt = placeholder;
      input.show();
    });
  }

  let answers: Record<string, string> = {};

  for (const question of questions) {
    if (question.type === QUESTION_TYPES.QUICK_PICK) {
      // @ts-ignore
      answers[question.name] = await createQuickPick(question);
    }
    if (question.type === QUESTION_TYPES.INPUT_BOX) {
      // @ts-ignore
      answers[question.name] = await createInputBox(question);
    }
  }

  console.log('answers', answers);
  return answers;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.conventionalCommits',
    async function (uri) {
      const git = getGitAPI();
      if (!git) {
        vscode.window.showErrorMessage('vscode.git is not enabled');
        return;
      }
      const answers = await prompt();
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
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
