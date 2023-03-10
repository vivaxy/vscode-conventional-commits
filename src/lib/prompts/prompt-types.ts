/**
 * @since 2020-03-25 09:12
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as configuration from '../configuration';
import createSimpleQuickPick, { confirmButton } from './quick-pick';
import localize from '../localize';
import * as output from '../output';
import { CommitStore } from '../commit-store';

const storeCommit = CommitStore.initialize();

export enum PROMPT_TYPES {
  QUICK_PICK,
  INPUT_BOX,
  CONFIGURABLE_QUICK_PICK,
}

export type Item = {
  label: string;
  detail?: string;
  description?: string;
  alwaysShow?: boolean;
  placeholder?: string;
};

export type Prompt = { name: string; type: PROMPT_TYPES } & Options &
  Partial<QuickPickOptions> &
  Partial<InputBoxOptions> &
  Partial<ConfigurableQuickPickOptions>;

export type PromptStatus = { value: string; activeItems: Item[] };

type Options = {
  placeholder: string;
  value?: string;
  format?: (input: string) => string;
  step: number;
  totalSteps: number;
  buttons?: vscode.QuickInputButton[];
  name: string;
};

type QuickPickOptions = {
  items: Item[];
  activeItems: Item[];
  noneItem?: Item;
} & Options;

async function createQuickPick({
  placeholder,
  items = [],
  activeItems = [],
  value,
  step,
  totalSteps,
  noneItem,
  buttons = [],
  name,
}: QuickPickOptions): Promise<PromptStatus> {
  if (noneItem && !items.includes(noneItem)) {
    items.unshift(noneItem);
  }
  const promptStatus: PromptStatus = await createSimpleQuickPick<Item>({
    placeholder,
    matchOnDescription: true,
    matchOnDetail: true,
    ignoreFocusOut: true,
    items,
    activeItems,
    value,
    step,
    totalSteps,
    buttons,
    name,
  });
  return promptStatus;
}

type InputBoxOptions = {
  validate?: (value: string) => string | undefined;
  name: string;
} & Options;

function createInputBox({
  placeholder,
  value,
  step,
  totalSteps,
  validate = () => undefined,
  buttons,
  name,
}: InputBoxOptions): Promise<PromptStatus> {
  return new Promise(function (resolve, reject) {
    const input = vscode.window.createInputBox();
    input.step = step;
    input.totalSteps = totalSteps;
    input.ignoreFocusOut = true;
    input.placeholder = placeholder;
    if (value) {
      input.value = value;
    }
    input.buttons = [...(buttons ?? []), confirmButton];
    input.onDidChangeValue(function () {
      try {
        input.validationMessage = validate(input.value);
        promptMessageMaxLength({ input, placeholder, name });
      } catch (e) {
        output.error(`step.${input.step}`, e);
        reject(e);
      }
    });
    input.onDidAccept(function () {
      try {
        input.validationMessage = validate(input.value);
        if (input.validationMessage) {
          return;
        }
        storeCommit.store(name, input.value);
        resolve({ value: input.value, activeItems: [] });
        input.dispose();
      } catch (e) {
        output.error(`step.${input.step}`, e);
        reject(e);
      }
    });
    input.onDidTriggerButton(function (e) {
      if (e === confirmButton) {
        try {
          if (input.validationMessage) {
            return;
          }
          resolve({ value: input.value, activeItems: [] });
          input.dispose();
        } catch (e) {
          output.error(`step.${input.step}`, e);
          reject(e);
        }
      }

      if (e === vscode.QuickInputButtons.Back) {
        reject({
          button: e,
          value: input.value,
        });
      }
    });
    promptMessageMaxLength({ input, placeholder, name });
    input.show();
  });
}

export type ConfigurableQuickPickOptions = {
  configurationKey: keyof configuration.Configuration;
  newItem: Item;
  newItemWithoutSetting: Item;
  addNoneOption: boolean;
  validate?: (value: string) => string | undefined;
} & QuickPickOptions;

async function createConfigurableQuickPick({
  placeholder,
  value,
  step,
  totalSteps,
  configurationKey,
  newItem,
  noneItem,
  activeItems = [],
  newItemWithoutSetting,
  validate = () => undefined,
  buttons,
  name,
}: ConfigurableQuickPickOptions): Promise<PromptStatus> {
  const currentValues: string[] = configuration.get<string[]>(configurationKey);
  const workspaceConfigurationItemInfo = {
    description: '',
    detail: localize('extension.sources.prompt.fromWorkspaceConfiguration'),
  };
  const items: Item[] = currentValues.map(function (value) {
    return {
      label: value,
      ...workspaceConfigurationItemInfo,
    };
  });
  items.push(newItem);
  items.push(newItemWithoutSetting);

  // If activeItems[0] is contained in items, then make activeItems[0] the activeItems[0] contained in items.
  if (activeItems[0]) {
    const activeItemInItems = items.find((item) => {
      const activeItemKeys = Object.keys(activeItems[0]).sort();
      const itemKeys = Object.keys(item).sort();
      if (JSON.stringify(activeItemKeys) !== JSON.stringify(itemKeys))
        return false;
      for (let i = 0; i < activeItemKeys.length; i++) {
        if (
          activeItems[0][activeItemKeys[i] as keyof Item] !==
          item[activeItemKeys[i] as keyof Item]
        )
          return false;
      }
      return true;
    });
    if (activeItemInItems !== undefined) {
      activeItems[0] = activeItemInItems;
    }
  }

  let promptStatus = await createQuickPick({
    placeholder,
    items,
    activeItems,
    value,
    step,
    totalSteps,
    noneItem,
    buttons,
    name,
  });
  if (
    promptStatus.activeItems[0] &&
    promptStatus.activeItems[0].label === newItem.label
  ) {
    const newItemInputStatus = await createInputBox({
      placeholder: newItem.placeholder ?? '',
      value: promptStatus.value,
      step,
      totalSteps,
      validate,
      buttons,
      name,
    });
    promptStatus.value = newItemInputStatus.value;
    if (promptStatus.value) {
      configuration.update(configurationKey, [
        ...currentValues,
        promptStatus.value,
      ]);
      promptStatus.activeItems = [
        {
          label: promptStatus.value,
          ...workspaceConfigurationItemInfo,
        },
      ];
    }
  }
  if (
    promptStatus.activeItems[0] &&
    promptStatus.activeItems[0].label === newItemWithoutSetting.label
  ) {
    promptStatus = {
      value: (
        await createInputBox({
          placeholder: newItemWithoutSetting.placeholder ?? '',
          value: promptStatus.value,
          step,
          totalSteps,
          validate,
          buttons,
          name,
        })
      ).value,
      activeItems: [newItemWithoutSetting],
    };
  }
  return promptStatus;
}

export default {
  [PROMPT_TYPES.QUICK_PICK]: createQuickPick,
  [PROMPT_TYPES.INPUT_BOX]: createInputBox,
  [PROMPT_TYPES.CONFIGURABLE_QUICK_PICK]: createConfigurableQuickPick,
};

/**
 * @description this function represent a complete commit message for help the user  regulate the limit of characters in commit
 */
function promptMessageMaxLength({
  input,
  placeholder,
  name,
}: {
  input: vscode.InputBox;
  placeholder: string;
  name?: string;
}) {
  const subjectMax: number = configuration.get<number>(
    'commitMaxLength.subject',
  );
  const bodyMax: number = configuration.get<number>('commitMaxLength.body');
  if (name && name === 'subject') {
    const type = storeCommit.get('type');
    const scope = storeCommit.get('scope');
    const gitmoji = storeCommit.get('gitmoji');

    var string = type;

    if (scope.length > 0) {
      string += `(${scope})`;
    }
    string += ': ';

    // If emoji just two caractere count
    if (gitmoji.length > 0) string += 'A ';

    string += input.value;
    input.prompt = `(${string.length.toString()}/${subjectMax.toString()}) ${placeholder}`;
  }
  if (name && name === 'body') {
    input.prompt = `(${input.value.length.toString()}/${bodyMax.toString()}) ${placeholder}`;
  }
}
