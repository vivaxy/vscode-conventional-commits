/**
 * @since 2020-06-12 13:25
 * @author vivaxy
 */
import * as vscode from 'vscode';

export const confirmButton: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon('arrow-right'),
  tooltip: 'confirm',
};

export default function createQuickPick<T extends vscode.QuickPickItem>({
  placeholder,
  items = [],
  activeItems = [],
  value = '',
  step,
  totalSteps,
  buttons = [],
}: Partial<vscode.QuickPick<T>>): Promise<{
  value: string;
  activeItems: T[];
}> {
  return new Promise(function (resolve, reject) {
    const picker = vscode.window.createQuickPick();
    picker.placeholder = placeholder;
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.ignoreFocusOut = true;
    picker.items = items;
    picker.activeItems = activeItems.length === 0 ? [items[0]] : activeItems;
    picker.value = value;
    picker.step = step;
    picker.totalSteps = totalSteps;
    picker.show();
    picker.buttons = [...buttons, confirmButton];
    picker.onDidAccept(function () {
      if (picker.activeItems.length) {
        resolve({
          value: picker.value,
          activeItems: picker.activeItems as T[],
        });
        picker.dispose();
      }
    });
    picker.onDidTriggerButton(function (e) {
      if (e === confirmButton) {
        if (picker.activeItems.length) {
          resolve({
            value: picker.value,
            activeItems: picker.activeItems as T[],
          });
        } else {
          resolve({
            value: picker.value,
            activeItems: [picker.items[0]] as T[],
          });
        }
        picker.dispose();
      }

      if (e === vscode.QuickInputButtons.Back) {
        reject({
          button: e,
          value: picker.value,
          activeItems: picker.activeItems,
        });
      }
    });
  });
}
