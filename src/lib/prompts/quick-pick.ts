/**
 * @since 2020-06-12 13:25
 * @author vivaxy
 */
import * as vscode from 'vscode';

export default function createQuickPick<T extends vscode.QuickPickItem>({
  placeholder,
  items = [],
  format = (i) => i,
  step,
  totalSteps,
}: Partial<
  vscode.QuickPick<T> & {
    format(i: T[]): T[];
  }
>): Promise<T[]> {
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
      if (picker.selectedItems.length) {
        const result = format(picker.selectedItems as T[]);
        picker.dispose();
        resolve(result);
      }
    });
  });
}
