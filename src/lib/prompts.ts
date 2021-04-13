/**
 * @since 2020-03-25 09:09
 * @author vivaxy
 */
import getTypesByLocale from '@yi-xu-0100/conventional-commit-types-i18n';
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
import {
  CommitMessage,
  serializeSubject,
  serializeHeader,
} from './commit-message';
import commitlint from './commitlint';
import { getPromptLocalize, locale } from './localize';

export default async function prompts({
  gitmoji,
  showEditor,
  emojiFormat,
  lineBreak,
  promptScopes,
  promptBody,
  promptFooter,
  promptBreakingChange,
  detectBreakingChange,
  breakingChangeFormat,
}: {
  gitmoji: boolean;
  showEditor: boolean;
  emojiFormat: configuration.EMOJI_FORMAT;
  lineBreak: string;
  promptScopes: boolean;
  promptBody: boolean;
  promptFooter: boolean;
  promptBreakingChange: boolean;
  detectBreakingChange: boolean;
  breakingChangeFormat: boolean;
}): Promise<CommitMessage> {
  const commitMessage = new CommitMessage();
  const conventionalCommitsTypes = getTypesByLocale(locale).types;

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
      return Object.keys(conventionalCommitsTypes).map(function (type) {
        const { title, description } = conventionalCommitsTypes[type];
        return {
          label: type,
          description: title,
          detail: description,
        };
      });
    }
    return typeEnum.map(function (type) {
      if (type in conventionalCommitsTypes) {
        const { description, title } = conventionalCommitsTypes[type];
        return {
          label: type,
          description: title,
          detail: description,
        };
      }
      return {
        label: type,
        description: '',
        detail: getPromptLocalize('type.fromCommitlintConfig'),
      };
    });
  }

  function getScopePrompt() {
    const name = 'scope';
    const placeholder = getPromptLocalize('scope.placeholder');
    const scopeEnum = commitlint.getScopeEnum();
    const noneItem = {
      label: getPromptLocalize('scope.noneItem.label'),
      description: '',
      detail: getPromptLocalize('scope.noneItem.detail'),
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
            detail: getPromptLocalize('type.fromCommitlintConfig'),
          };
        }),
        noneItem,
      };
    }

    return {
      type: PROMPT_TYPES.CONFIGURABLE_QUICK_PICK,
      name,
      placeholder,
      configurationKey: keys.SCOPES as keyof configuration.Configuration,
      noneItem,
      newItem: {
        label: getPromptLocalize('scope.newItem.label'),
        description: '',
        detail: getPromptLocalize('scope.newItem.detail'),
        alwaysShow: true,
        placeholder: getPromptLocalize('scope.newItem.placeholder'),
      },
      newItemWithoutSetting: {
        label: getPromptLocalize('scope.newItemWithoutSetting.label'),
        description: '',
        detail: getPromptLocalize('scope.newItemWithoutSetting.detail'),
        alwaysShow: true,
        placeholder: getPromptLocalize('scope.newItem.placeholder'),
      },
      validate(input: string) {
        return commitlint.lintScope(input);
      },
    };
  }

  const questions: Prompt[] = [
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'type',
      placeholder: getPromptLocalize('type.placeholder'),
      items: getTypeItems(),
      validate(input: string) {
        return commitlint.lintType(input);
      },
    },
    getScopePrompt(),
    {
      type: PROMPT_TYPES.BREAKING_CHANGE_QUICK_PICK,
      name: 'breakingChange',
      placeholder: getPromptLocalize('breakingChange.placeholder'),
      noneItem: {
        label: getPromptLocalize('breakingChange.noneItem.label'),
        description: '',
        detail: getPromptLocalize('breakingChange.noneItem.detail'),
        alwaysShow: true,
      },
      pointItem: {
        label: getPromptLocalize('breakingChange.pointItem.label'),
        description: '',
        detail: getPromptLocalize('breakingChange.pointItem.detail'),
        alwaysShow: true,
      },
      spaceItem: {
        label: getPromptLocalize('breakingChange.spaceItem.label'),
        description: '',
        detail: getPromptLocalize('breakingChange.spaceItem.detail'),
        alwaysShow: true,
        placeholder: getPromptLocalize('breakingChange.message.placeholder'),
      },
      hyphenItem: {
        label: getPromptLocalize('breakingChange.hyphenItem.label'),
        description: '',
        detail: getPromptLocalize('breakingChange.hyphenItem.detail'),
        alwaysShow: true,
        placeholder: getPromptLocalize('breakingChange.message.placeholder'),
      },
      breakingChangeFormat: breakingChangeFormat,
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.QUICK_PICK,
      name: 'gitmoji',
      placeholder: getPromptLocalize('gitmoji.placeholder'),
      items: gitmojis.gitmojis.map(function ({ emoji, code, description }) {
        return {
          label: emojiFormat === 'code' ? code : emoji,
          description: emojiFormat === 'code' ? emoji : '',
          detail: description,
        };
      }),
      noneItem: {
        label: getPromptLocalize('gitmoji.noneItem.label'),
        description: '',
        detail: getPromptLocalize('gitmoji.noneItem.detail'),
        alwaysShow: true,
      },
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'subject',
      placeholder: getPromptLocalize('subject.placeholder'),
      validate(input: string) {
        const { type, scope, breakingChange, gitmoji } = commitMessage;
        const serializedSubject = serializeSubject({
          gitmoji,
          subject: input,
        });
        let subjectError = commitlint.lintSubject(serializedSubject);
        if (subjectError) {
          if (gitmoji) {
            subjectError += ' (';
            subjectError += getPromptLocalize('subject.error.including');
            subjectError += getPromptLocalize('subject.error.gitmoji');
            subjectError += gitmoji;
            subjectError += ')';
          }
          return subjectError;
        }

        let headerError = commitlint.lintHeader(
          serializeHeader({
            partialCommitMessage: {
              type,
              scope,
              breakingChange,
              gitmoji,
              subject: input,
            },
            detectBreakingChange: detectBreakingChange,
          }),
        );
        if (headerError) {
          headerError += ' (';
          headerError += getPromptLocalize('subject.error.including');
          headerError += getPromptLocalize('subject.error.type');
          headerError += type;
          if (scope) {
            headerError += ', ';
            headerError += getPromptLocalize('subject.error.scope');
            headerError += scope;
          }
          if (gitmoji) {
            headerError += ', ';
            headerError += getPromptLocalize('subject.error.gitmoji');
            headerError += gitmoji;
          }
          headerError += ')';
          return headerError;
        }

        return '';
      },
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'body',
      placeholder: getPromptLocalize('body.placeholder'),
      validate(input: string) {
        return commitlint.lintBody(input);
      },
      format: lineBreakFormatter,
    },
    {
      type: PROMPT_TYPES.INPUT_BOX,
      name: 'footer',
      placeholder: getPromptLocalize('footer.placeholder'),
      validate(input: string) {
        return commitlint.lintFooter(input);
      },
      format: lineBreakFormatter,
    },
  ]
    .filter(function (question) {
      if (question.name === 'scope' && !promptScopes) return false;

      if (question.name === 'gitmoji' && !gitmoji) return false;

      if (question.name === 'breakingChange') {
        if (!promptBreakingChange) return false;
      }

      if (question.name === 'body') {
        if (showEditor || !promptBody) return false;
      }

      if (question.name === 'footer') {
        if (showEditor || !promptFooter) return false;
      }
      return true;
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
