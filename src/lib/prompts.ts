/**
 * @since 2020-03-25 09:09
 * @author vivaxy
 */
const conventionalCommitsTypes = require('conventional-commit-types');

import * as configuration from './configuration';
import gitmojis from '../vendors/gitmojis';
import promptTypes, { PROMPT_TYPES, Prompt } from './prompts/prompt-types';
import * as names from '../configs/names';

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
  commlintRules,
}: {
  gitmoji: boolean;
  commlintRules: {
    subjectMaxLength: number;
    bodyMaxLength: number;
    footerMaxLength: number;
  };
}): Promise<Answers> {
  const questions: Prompt[] = [
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'type',
      placeholder: "Select the type of change that you're committing.",
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
      type: PROMPT_TYPES.CONFIGURIABLE_QUICK_PICK,
      name: 'scope',
      placeholder: 'Denote the scope of this change.',
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
    },
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'gitmoji',
      placeholder: 'Choose a gitmoji.',
      items: [
        {
          label: 'none',
          description: '',
          detail: 'No gitmoji.',
          alwaysShow: true,
        },
        ...gitmojis.gitmojis.map(function ({ emoji, code, description }) {
          return {
            label: code,
            description: emoji,
            detail: description,
          };
        }),
      ],
      format(input: string) {
        if (input === 'none') {
          return '';
        }
        return input;
      },
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'subject',
      placeholder: 'Write a short, imperative tense description of the change.',
      validate(input: string) {
        if (input.length > commlintRules.subjectMaxLength) {
          return `Subject has more than ${commlintRules.subjectMaxLength} characters.`;
        }
      },
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
