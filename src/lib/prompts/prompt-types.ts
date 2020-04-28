/**
 * @since 2020-03-25 09:12
 * @author vivaxy
 */
import * as vscode from 'vscode';
import * as configuration from '../configuration';

export enum PROMPT_TYPES {
  QUICK_PICK,
  INPUT_BOX,
  CONFIGURIABLE_QUICK_PICK,
}

type Item = {
  label: string;
  detail?: string;
  description?: string;
  alwaysShow?: boolean;
};

export type Prompt = { name: string; type: PROMPT_TYPES } & Options &
  Partial<QuickPickOptions> &
  Partial<InputBoxOptions> &
  Partial<ConfiguriableQuickPickOptions>;

type Options = {
  placeholder: string;
  format?: (input: string) => string;
  step: number;
  totalSteps: number;
  validate?: (value: string) => string | undefined;
};

type QuickPickOptions = {
  items: Item[];
} & Options;

function createQuickPick({
  placeholder,
  items = [],
  format = (i) => i,
  step,
  totalSteps,
  validate = () => undefined,
}: QuickPickOptions): Promise<string> {
  return new Promise(function (resolve) {
    const picker = vscode.window.createQuickPick();
    picker.placeholder = placeholder;
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.ignoreFocusOut = true;
    picker.items = items;
    picker.step = step;
    picker.totalSteps = totalSteps;
    picker.show();
    picker.onDidAccept(function () {
      const result = format(picker.selectedItems[0].label);
      picker.dispose();
      resolve(result);
    });
  });
}

type InputBoxOptions = Options;

function createInputBox({
  placeholder,
  format = (i) => i,
  step,
  totalSteps,
  validate = () => undefined,
}: InputBoxOptions): Promise<string> {
  return new Promise(function (resolve) {
    const input = vscode.window.createInputBox();
    input.step = step;
    input.totalSteps = totalSteps;
    input.ignoreFocusOut = true;
    input.placeholder = placeholder;
    input.onDidChangeValue(function () {
      input.validationMessage = validate(input.value);
    });
    input.onDidAccept(function () {
      const result = format(input.value);
      input.dispose();
      resolve(result);
    });
    input.prompt = placeholder;
    input.show();
  });
}

type ConfiguriableQuickPickOptions = {
  configurationKey: keyof configuration.Configuration;
  newItem: Item;
  noneItem?: Item;
  newItemPlaceholder: string;
  addNoneOption: boolean;
} & QuickPickOptions;

async function createConfiguriableQuickPick({
  placeholder,
  format = (i) => i,
  step,
  totalSteps,
  configurationKey,
  newItem,
  noneItem,
  newItemPlaceholder,
}: ConfiguriableQuickPickOptions): Promise<string> {
  const currentValus: string[] = configuration.get<string[]>(configurationKey);
  const items: Item[] = [];
  if (noneItem) {
    items.push(noneItem);
  }
  items.push(
    ...currentValus.map(function (value) {
      return {
        label: value,
      };
    }),
  );
  items.push(newItem);
  let selectedValue = await createQuickPick({
    placeholder,
    items,
    step,
    totalSteps,
  });
  if (selectedValue === newItem.label) {
    selectedValue = await createInputBox({
      placeholder: newItemPlaceholder,
      step,
      totalSteps,
    });
    configuration.update(configurationKey, [...currentValus, selectedValue]);
  } else if (noneItem && selectedValue === noneItem.label) {
    selectedValue = '';
  }
  return format(selectedValue);
}

export default {
  [PROMPT_TYPES.QUICK_PICK]: createQuickPick,
  [PROMPT_TYPES.INPUT_BOX]: createInputBox,
  [PROMPT_TYPES.CONFIGURIABLE_QUICK_PICK]: createConfiguriableQuickPick,
};
