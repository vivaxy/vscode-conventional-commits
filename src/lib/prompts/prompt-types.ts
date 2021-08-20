/**
 * @since 2020-03-25 09:12
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as configuration from '../configuration';
import createSimpleQuickPick from './quick-pick';
import localize from '../localize';
import * as output from '../output';

export enum PROMPT_TYPES {
  QUICK_PICK,
  INPUT_BOX,
  CONFIGURABLE_QUICK_PICK,
}

type Item = {
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

type Options = {
  placeholder: string;
  value?: string;
  format?: (input: string) => string;
  step: number;
  totalSteps: number;
  buttons?: vscode.QuickInputButton[];
};

type QuickPickOptions = {
  items: Item[];
  noneItem?: Item;
} & Options;

async function createQuickPick({
  placeholder,
  items = [],
  value,
  step,
  totalSteps,
  noneItem,
  buttons = [],
}: QuickPickOptions): Promise<string> {
  const pickerItems = items;
  if (noneItem && !pickerItems.includes(noneItem)) {
    pickerItems.unshift(noneItem);
  }

  const selectedItems = await createSimpleQuickPick<Item>({
    placeholder,
    matchOnDescription: true,
    matchOnDetail: true,
    ignoreFocusOut: true,
    items,
    value,
    step,
    totalSteps,
    buttons,
  });

  let selectedValue = selectedItems[0].label;
  if (noneItem && selectedValue === noneItem.label) {
    selectedValue = '';
  }
  return selectedValue;
}

type InputBoxOptions = {
  validate?: (value: string) => string | undefined;
} & Options;

function createInputBox({
  placeholder,
  value,
  step,
  totalSteps,
  validate = () => undefined,
  buttons,
}: InputBoxOptions): Promise<string> {
  return new Promise(function (resolve, reject) {
    const input = vscode.window.createInputBox();
    input.step = step;
    input.totalSteps = totalSteps;
    input.ignoreFocusOut = true;
    input.placeholder = placeholder;
    if (value) {
      input.value = value;
    }
    if (buttons) {
      input.buttons = buttons;
    }
    input.onDidChangeValue(function () {
      try {
        input.validationMessage = validate(input.value);
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
        const result = input.value;
        input.dispose();
        resolve(result);
      } catch (e) {
        output.error(`step.${input.step}`, e);
        reject(e);
      }
    });
    input.onDidTriggerButton(function (e) {
      if (e === vscode.QuickInputButtons.Back) {
        reject({ button: e, value: input.value });
      }
    });
    input.prompt = placeholder;
    input.show();
  });
}

type ConfigurableQuickPickOptions = {
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
  newItemWithoutSetting,
  validate = () => undefined,
  buttons,
}: ConfigurableQuickPickOptions): Promise<string> {
  const currentValues: string[] = configuration.get<string[]>(configurationKey);
  const items: Item[] = currentValues.map(function (value) {
    return {
      label: value,
      description: '',
      detail: localize('extension.sources.prompt.fromWorkspaceConfiguration'),
    };
  });
  items.push(newItem);
  items.push(newItemWithoutSetting);
  let selectedValue = await createQuickPick({
    placeholder,
    items,
    value,
    step,
    totalSteps,
    noneItem,
    buttons,
  });
  if (selectedValue === newItem.label) {
    selectedValue = await createInputBox({
      placeholder: newItem.placeholder!,
      value,
      step,
      totalSteps,
      validate,
      buttons,
    });
    if (selectedValue) {
      configuration.update(configurationKey, [...currentValues, selectedValue]);
    }
  }
  if (selectedValue === newItemWithoutSetting.label) {
    selectedValue = await createInputBox({
      placeholder: newItemWithoutSetting.placeholder!,
      value,
      step,
      totalSteps,
      validate,
      buttons,
    });
  }
  return selectedValue;
}

export default {
  [PROMPT_TYPES.QUICK_PICK]: createQuickPick,
  [PROMPT_TYPES.INPUT_BOX]: createInputBox,
  [PROMPT_TYPES.CONFIGURABLE_QUICK_PICK]: createConfigurableQuickPick,
};
