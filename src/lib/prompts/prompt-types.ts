/**
 * @since 2020-03-25 09:12
 * @author vivaxy
 */
import * as vscode from 'vscode';

export enum PROMPT_TYPES {
  QUICK_PICK,
  INPUT_BOX,
  CONFIGURIABLE_QUICK_PICK,
}

export type Prompt = { name: string; type: PROMPT_TYPES } & Options &
  Partial<QuickPickOptions> &
  Partial<InputBoxOptions> &
  Partial<ConfiguriableQuickPickOptions>;

type Options = {
  placeholder: string;
  format?: (input: string) => string;
  step: number;
  totalSteps: number;
};

type QuickPickOptions = {
  items: { label: string; detail?: string; description?: string }[];
} & Options;

function createQuickPick({
  placeholder,
  items = [],
  format = (i) => i,
  step,
  totalSteps,
}: QuickPickOptions): Promise<string> {
  return new Promise(function (resolve) {
    const picker = vscode.window.createQuickPick();
    picker.placeholder = placeholder;
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.ignoreFocusOut = false;
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
}: InputBoxOptions): Promise<string> {
  return new Promise(function (resolve) {
    const input = vscode.window.createInputBox();
    input.step = step;
    input.totalSteps = totalSteps;
    input.ignoreFocusOut = false;
    input.placeholder = placeholder;
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
  context: vscode.ExtensionContext;
  workspaceStateKey: string;
  newItem: {
    label: string;
    description: string;
    detail?: string;
  };
  newItemPlaceholder: string;
} & QuickPickOptions;

async function createConfiguriableQuickPick({
  placeholder,
  format = (i) => i,
  items,
  step,
  totalSteps,
  workspaceStateKey,
  context,
  newItem,
  newItemPlaceholder,
}: ConfiguriableQuickPickOptions): Promise<string> {
  let currentValus: string[] = [];
  if (!items) {
    currentValus = context.workspaceState.get(workspaceStateKey, []);
    items = [
      ...currentValus.map(function (value) {
        return {
          label: value,
        };
      }),
      {
        label: newItem.label,
        description: newItem.description,
        detail: newItem.detail,
      },
    ];
  }
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
    context.workspaceState.update(workspaceStateKey, [
      ...currentValus,
      selectedValue,
    ]);
  }
  return format(selectedValue);
}

export default {
  [PROMPT_TYPES.QUICK_PICK]: createQuickPick,
  [PROMPT_TYPES.INPUT_BOX]: createInputBox,
  [PROMPT_TYPES.CONFIGURIABLE_QUICK_PICK]: createConfiguriableQuickPick,
};
