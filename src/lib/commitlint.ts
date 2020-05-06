/**
 * @since 2020-04-28 14:37
 * @author vivaxy
 */
import * as load from '@commitlint/load';

async function loadRules(cwd: string) {
  try {
    // @ts-ignore
    const { rules } = await load({}, { cwd });
    return rules;
  } catch (e) {
    // catch if `Cannot find module "@commitlint/config-conventional"` happens.
    return {};
  }
}

export async function getRules({ cwd }: { cwd: string }) {
  const rules: load.Rules = await loadRules(cwd);
  return {
    subjectMaxLength: getRuleValue(rules['subject-max-length'], Infinity),
    bodyMaxLength: getRuleValue(rules['body-max-length'], Infinity),
    footerMaxLength: getRuleValue(rules['footer-max-length'], Infinity),
  };
}

export function getRuleValue(
  [level, applicable, value]: load.Rule<number> = [0, 'never', 0],
  defaultValue: number,
) {
  return level === 2 && applicable === 'always' ? value : defaultValue;
}
