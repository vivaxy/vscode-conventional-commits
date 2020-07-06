/**
 * @since 2020-03-25 09:09
 * @author vivaxy
 */
const conventionalCommitsTypes = require('conventional-commit-types');

import * as configuration from './configuration';
import gitmojis from '../vendors/gitmojis';
import promptTypes, { PROMPT_TYPES, Prompt } from './prompts/prompt-types';
import * as names from '../configs/names';
import { CommitlintRules } from './commitlint';

export type Answers = {
  type: string;
  scope: string;
  gitmoji: string;
  subject: string;
  body: string;
  footer: string;
};

export default async function prompts({
  gitmoji,
  emojiFormat,
  commlintRules,
  lineBreak,
}: {
  gitmoji: boolean;
  emojiFormat: configuration.EMOJI_FORMAT;
  commlintRules: CommitlintRules;
  lineBreak: string;
}): Promise<Answers> {
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
    if (commlintRules.typeEnum.length === 0) {
      return Object.keys(conventionalCommitsTypes.types).map(function (type) {
        const { title, description } = conventionalCommitsTypes.types[type];
        return {
          label: type,
          description: title,
          detail: description,
        };
      });
    }
    return commlintRules.typeEnum.map(function (type) {
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
        description: names.DESCRIPTION_OF_AN_ITEM_FROM_COMMITLINT_CONFIG,
        detail: names.DETAIL_OF_AN_ITEM_FROM_COMMITLINT_CONFIG,
      };
    });
  }

  function getScopePrompt() {
    const name = 'scope';
    const placeholder = 'Select the scope of this change.';
    if (commlintRules.scopeEnum.length) {
      return {
        type: PROMPT_TYPES.QUICK_PICK,
        name,
        placeholder,
        items: commlintRules.scopeEnum.map(function (scope) {
          return {
            label: scope,
            description: names.DESCRIPTION_OF_AN_ITEM_FROM_COMMITLINT_CONFIG,
            detail: names.DETAIL_OF_AN_ITEM_FROM_COMMITLINT_CONFIG,
          };
        }),
        noneItem: {
          label: 'None',
          description: '',
          detail: 'No scope.',
          alwaysShow: true,
        },
      };
    }

    return {
      type: PROMPT_TYPES.CONFIGURIABLE_QUICK_PICK,
      name,
      placeholder,
      configurationKey: names.SCOPES as keyof configuration.Configuration,
      newItem: {
        label: 'New scope',
        description: '',
        detail:
          'Add a workspace scope. (You can manage scopes in workspace `settings.json`.)',
        alwaysShow: true,
      },
      noneItem: {
        label: 'None',
        description: '',
        detail: 'No scope.',
        alwaysShow: true,
      },
      newItemPlaceholder: 'Create a new scope.',
    };
  }

  const questions: Prompt[] = [
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'type',
      placeholder: "Select the type of change that you're committing.",
      items: getTypeItems(),
    },
    getScopePrompt(),
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'gitmoji',
      placeholder: 'Choose a gitmoji.',
      items: gitmojis.gitmojis.map(function ({ emoji, code, description }) {
        return {
          label: emojiFormat === 'code' ? code : emoji,
          description: emojiFormat === 'code' ? emoji : '',
          detail: description,
        };
      }),
      noneItem: {
        label: 'None',
        description: '',
        detail: 'No gitmoji.',
        alwaysShow: true,
      },
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'subject',
      placeholder: 'Write a short, imperative tense description of the change.',
      validate(input: string) {
        if (commlintRules.subjectEmpty === 'never' && input.length === 0) {
          return 'Subject may not be empty.';
        } else if (input.length < commlintRules.subjectMinLength) {
          return `Subject must not be shorter than ${commlintRules.subjectMinLength} characters.`;
        } else if (input.length > commlintRules.subjectMaxLength) {
          return `Subject has more than ${commlintRules.subjectMaxLength} characters.`;
        }
      },
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'body',
      placeholder: 'Provide a longer description of the change.',
      validate(input: string) {
        if (input.length > commlintRules.bodyMaxLength) {
          return `Body has more than ${commlintRules.bodyMaxLength} characters.`;
        }
      },
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'footer',
      placeholder: 'List any breaking changes or issues closed by this change.',
      validate(input: string) {
        if (input.length > commlintRules.footerMaxLength) {
          return `Footer has more than ${commlintRules.footerMaxLength} characters.`;
        }
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

  const answers: Answers = {
    type: '',
    scope: '',
    gitmoji: '',
    subject: '',
    body: '',
    footer: '',
  };

  for (const question of questions) {
    answers[question.name as keyof Answers] = await promptTypes[question.type](
      // @ts-ignore
      question,
    );
  }
  return answers;
}
