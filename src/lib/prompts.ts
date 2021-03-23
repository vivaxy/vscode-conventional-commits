/**
 * @since 2020-03-25 09:09
 * @author vivaxy
 */
import { conventionalCommitsTypes as getConventionalCommitsTypesByLocale } from '@yi-xu-0100/conventional-commit-types-i18n';
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
  serializeHeader,
} from './commit-message';
import commitlint from './commitlint';
import localize, { locale } from './localize';

export default async function prompts({
  gitmoji,
  showEditor,
  emojiFormat,
  lineBreak,
  promptScopes,
}: {
  gitmoji: boolean;
  showEditor: boolean;
  emojiFormat: configuration.EMOJI_FORMAT;
  lineBreak: string;
  promptScopes: boolean;
}): Promise<CommitMessage> {
  const conventionalCommitsTypes = getConventionalCommitsTypesByLocale(locale);

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
        // @ts-ignore
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
        // @ts-ignore
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
      type: PROMPT_TYPES.CONFIGURABLE_QUICK_PICK,
      name,
      placeholder,
      configurationKey: keys.SCOPES as keyof configuration.Configuration,
      newItem: {
        label: localize('extension.sources.prompt.scope.newItem.label'),
        description: '',
        detail: localize('extension.sources.prompt.scope.newItem.detail'),
        alwaysShow: true,
        placeholder: localize(
          'extension.sources.prompt.scope.newItem.placeholder',
        ),
      },
      noneItem,
      newItemWithoutSetting: {
        label: localize(
          'extension.sources.prompt.scope.newItemWithoutSetting.label',
        ),
        description: '',
        detail: localize(
          'extension.sources.prompt.scope.newItemWithoutSetting.detail',
        ),
        alwaysShow: true,
        placeholder: localize(
          'extension.sources.prompt.scope.newItem.placeholder',
        ),
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
        const { type, scope, gitmoji } = commitMessage;
        const serializedSubject = serializeSubject({
          gitmoji,
          subject: input,
        });
        let subjectError = commitlint.lintSubject(serializedSubject);
        if (subjectError) {
          if (gitmoji) {
            subjectError += ' (';
            subjectError += localize(
              'extension.sources.prompt.subject.error.including',
            );
            subjectError += localize(
              'extension.sources.prompt.subject.error.gitmoji',
            );
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
          headerError += localize(
            'extension.sources.prompt.subject.error.including',
          );
          headerError += localize(
            'extension.sources.prompt.subject.error.type',
          );
          headerError += type;
          if (scope) {
            headerError += ', ';
            headerError += localize(
              'extension.sources.prompt.subject.error.scope',
            );
            headerError += scope;
          }
          if (gitmoji) {
            headerError += ', ';
            headerError += localize(
              'extension.sources.prompt.subject.error.gitmoji',
            );
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
      if (!promptScopes && question.name === 'scope') {
        return false;
      } else if (!gitmoji && question.name === 'gitmoji') {
        return false;
      } else if (
        showEditor &&
        (question.name === 'body' || question.name === 'footer')
      ) {
        return false;
      } else {
        return true;
      }
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
