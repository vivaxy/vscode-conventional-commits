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
} = require('../vendors/gitmojis.json');

import * as configuration from './configuration';
import promptTypes, {
  PROMPT_TYPES,
  Item,
  Prompt,
  PromptStatus,
} from './prompts/prompt-types';
import * as keys from '../configs/keys';
import {
  CommitMessage,
  serializeSubject,
  serializeHeader,
} from './commit-message';
import commitlint from './commitlint';
import { getPromptLocalize, locale } from './localize';
import { QuickInputButtons } from 'vscode';

export default async function prompts({
  gitmoji,
  showEditor,
  emojiFormat,
  lineBreak,
  promptScopes,
  promptBody,
  promptFooter,
}: {
  gitmoji: boolean;
  showEditor: boolean;
  emojiFormat: configuration.EMOJI_FORMAT;
  lineBreak: string;
  promptScopes: boolean;
  promptBody: boolean;
  promptFooter: boolean;
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

  function getTypeItems(): Item[] {
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

  function getScopePrompt(): Omit<Prompt, 'step' | 'totalSteps'> {
    const name = 'scope';
    const placeholder = getPromptLocalize('scope.placeholder');
    const scopeEnum = commitlint.getScopeEnum();
    const noneItem: Item = {
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
        items: scopeEnum.map(function (scope): Item {
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
      newItem: {
        label: getPromptLocalize('scope.newItem.label'),
        description: '',
        detail: getPromptLocalize('scope.newItem.detail'),
        alwaysShow: true,
        placeholder: getPromptLocalize('scope.newItem.placeholder'),
      },
      noneItem,
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
        const { type, scope, gitmoji } = commitMessage;
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
            type,
            scope,
            gitmoji,
            subject: input,
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
        buttons: index > 0 ? [QuickInputButtons.Back] : [],
      };
    });

  const promptStatuses: PromptStatus[] = new Array<PromptStatus>(
    questions.length,
  )
    .fill({
      value: '',
      activeItems: [],
    })
    .map(() => ({
      value: '',
      activeItems: [],
    }));

  let index = 0;
  while (index < questions.length) {
    const activeItem = promptStatuses[index].activeItems[0];
    if (questions[index].type === PROMPT_TYPES.QUICK_PICK) {
      if (activeItem) {
        questions[index].activeItems = [activeItem];
      }
    } else if (questions[index].type === PROMPT_TYPES.CONFIGURABLE_QUICK_PICK) {
      if (activeItem) {
        questions[index].activeItems = [activeItem];
        if (questions[index].newItemWithoutSetting) {
          if (activeItem === questions[index].newItemWithoutSetting) {
            questions[index].value = promptStatuses[index].value;
          } else {
            questions[index].value = '';
          }
        }
      }
    } else {
      questions[index].value = promptStatuses[index].value;
    }

    try {
      promptStatuses[index] = await promptTypes[questions[index].type](
        // @ts-ignore
        questions[index],
      );
    } catch (e) {
      if (e && 'button' in e) {
        if (e.button === QuickInputButtons.Back) {
          promptStatuses[index] = {
            value: 'value' in e ? e.value : promptStatuses[index].value,
            activeItems:
              'activeItems' in e
                ? e.activeItems
                : promptStatuses[index].activeItems,
          };
          index -= 1;
          continue;
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }

    index += 1;
  }

  promptStatuses
    .map((p, index) => {
      const activeItem = p.activeItems[0];
      if (!activeItem) return p.value;
      if (questions[index].noneItem && activeItem === questions[index].noneItem)
        return '';
      if (questions[index].newItem && activeItem === questions[index].newItem)
        return p.value;
      if (
        questions[index].newItemWithoutSetting &&
        activeItem === questions[index].newItemWithoutSetting
      )
        return p.value;
      return activeItem.label;
    })
    .forEach((value, index) => {
      commitMessage[questions[index].name as keyof CommitMessage] =
        questions[index].format?.(value) ?? value;
    });

  return commitMessage;
}
