/**
 * @since 2020-03-25 09:09
 * @author vivaxy
 */
const conventionalCommitsTypes = require('conventional-commit-types');
const gitmojis: {
  gitmojis: {
    emoji: string;
    entity: string;
    code: string;
    description: string;
    name: string;
  }[];
} = require('gitmojis');

import * as configuration from './configuration';
import promptTypes, { PROMPT_TYPES, Prompt } from './prompts/prompt-types';
import * as keys from '../configs/keys';
import commitMessage, {
  CommitMessage,
  serializeSubject,
} from './commit-message';
import commitlint from './commitlint';
import localize from './localize';

export default async function prompts({
  gitmoji,
  emojiFormat,
  lineBreak,
}: {
  gitmoji: boolean;
  emojiFormat: configuration.EMOJI_FORMAT;
  lineBreak: string;
}): Promise<CommitMessage> {
  function lineBreakFormatter(input: string): string {
    if (lineBreak) {
      return input.replace(
        new RegExp(lineBreak.replace(/\\/g, '\\\\'), 'g'),
        '\n',
      );
    }
    return input;
  }

  function getTypeItems() {
    const typeEnum = commitlint.getTypeEnum();
    if (typeEnum.length === 0) {
      return Object.keys(conventionalCommitsTypes.types).map(function (type) {
        const { title, description } = conventionalCommitsTypes.types[type];
        return {
          label: type,
          description: title,
          detail: description,
        };
      });
    }
    return typeEnum.map(function (type) {
      if (type in conventionalCommitsTypes.types) {
        const { description, title } = conventionalCommitsTypes.types[type];
        return {
          label: type,
          description: title,
          detail: description,
        };
      }
      return {
        label: type,
        description: '',
        detail: localize('extension.sources.prompt.type.fromCommitlintConfig'),
      };
    });
  }

  function getScopePrompt() {
    const name = 'scope';
    const placeholder = localize('extension.sources.prompt.scope.placeholder');
    const scopeEnum = commitlint.getScopeEnum();
    const noneItem = {
      label: localize('extension.sources.prompt.scope.noneItem.label'),
      description: '',
      detail: localize('extension.sources.prompt.scope.noneItem.detail'),
      alwaysShow: true,
    };
    if (scopeEnum.length) {
      return {
        type: PROMPT_TYPES.QUICK_PICK,
        name,
        placeholder,
        items: scopeEnum.map(function (scope) {
          return {
            label: scope,
            description: '',
            detail: localize(
              'extension.sources.prompt.type.fromCommitlintConfig',
            ),
          };
        }),
        noneItem,
      };
    }

    return {
      type: PROMPT_TYPES.CONFIGURIABLE_QUICK_PICK,
      name,
      placeholder,
      configurationKey: keys.SCOPES as keyof configuration.Configuration,
      newItem: {
        label: localize('extension.sources.prompt.scope.newItem.label'),
        description: '',
        detail: localize('extension.sources.prompt.scope.newItem.detail'),
        alwaysShow: true,
      },
      noneItem,
      newItemPlaceholder: localize(
        'extension.sources.prompt.scope.newItem.placeholder',
      ),
      validate(input: string) {
        return commitlint.lintScope(input);
      },
    };
  }

  const questions: Prompt[] = [
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'type',
      placeholder: localize('extension.sources.prompt.type.placeholder'),
      items: getTypeItems(),
      validate(input: string) {
        return commitlint.lintType(input);
      },
    },
    getScopePrompt(),
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'gitmoji',
      placeholder: localize('extension.sources.prompt.gitmoji.placeholder'),
      items: gitmojis.gitmojis.map(function ({ emoji, code, description }) {
        return {
          label: emojiFormat === 'code' ? code : emoji,
          description: emojiFormat === 'code' ? emoji : '',
          detail: description,
        };
      }),
      noneItem: {
        label: localize('extension.sources.prompt.gitmoji.noneItem.label'),
        description: '',
        detail: localize('extension.sources.prompt.gitmoji.noneItem.detail'),
        alwaysShow: true,
      },
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'subject',
      placeholder: localize('extension.sources.prompt.subject.placeholder'),
      validate(input: string) {
        const error = commitlint.lintSubject(
          serializeSubject({
            gitmoji: commitMessage.gitmoji,
            subject: input,
          } as CommitMessage),
        );
        if (error && commitMessage.gitmoji) {
          return `${error} (${localize(
            'extension.sources.prompt.subject.error.includingGitmoji',
          )}${commitMessage.gitmoji})`;
        }
        return error;
      },
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'body',
      placeholder: localize('extension.sources.prompt.body.placeholder'),
      validate(input: string) {
        return commitlint.lintBody(input);
      },
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'footer',
      placeholder: localize('extension.sources.prompt.footer.placeholder'),
      validate(input: string) {
        return commitlint.lintFooter(input);
      },
      format: lineBreakFormatter,
    },
  ]
    .filter(function (question) {
      if (gitmoji) {
        return true;
      }
      return question.name !== 'gitmoji';
    })
    .map(function (question, index, array) {
      return {
        ...question,
        step: index + 1,
        totalSteps: array.length,
      };
    });

  for (const question of questions) {
    commitMessage[question.name as keyof CommitMessage] = await promptTypes[
      question.type
    ](
      // @ts-ignore
      question,
    );
  }
  return commitMessage;
}
