/**
 * @since 2020-06-12 13:25
 * @author vivaxy
 */
import * as vscode from 'vscode';

export default function createQuickPick<T extends vscode.QuickPickItem>({
  placeholder,
  items = [],
  value = '',
  format = (i) => i,
  step,
  totalSteps,
  buttons = [],
}: Partial<
  vscode.QuickPick<T> & {
    format(i: T[]): T[];
  }
>): Promise<T[]> {
  return new Promise(function (resolve, reject) {
    const picker = vscode.window.createQuickPick();
    picker.placeholder = placeholder;
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.ignoreFocusOut = true;
    picker.items = items;
    picker.value = value;
    picker.step = step;
    picker.totalSteps = totalSteps;
    picker.buttons = buttons;
    picker.show();
    picker.onDidAccept(function () {
      if (picker.selectedItems.length) {
        const result = format(picker.selectedItems as T[]);
        picker.dispose();
        resolve(result);
      }
    });
    picker.onDidTriggerButton(function (e) {
      if (e === vscode.QuickInputButtons.Back) {
        reject({ button: e, value: picker.value });
      }
    });
  });
}
