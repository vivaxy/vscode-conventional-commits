/**
 * @since 2020-03-25 09:09
 * @author vivaxy
 */
const conventionalCommitsTypes = require('conventional-commit-types');

import gitmojis from '../vendors/gitmojis';
import promptTypes, { PROMPT_TYPES, Prompt } from './prompts/prompt-types';

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
}: {
  gitmoji: boolean;
}): Promise<Answers> {
  const questions: Prompt[] = [
    {
      type: PROMPT_TYPES.QUICK_PICK,
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
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'scope',
      placeholder: 'Denote the scope of this change',
    },
    {
      type: PROMPT_TYPES.QUICK_PICK,
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
      placeholder: 'Write a short, imperative tense description of the change',
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'body',
      placeholder: 'Provide a longer description of the change',
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'footer',
      placeholder: 'List any breaking changes or issues closed by this change',
    },
  ].filter(function (question) {
    if (gitmoji) {
      return true;
    }
    return question.name !== 'gitmoji';
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
      question,
    );
  }
  return answers;
}
