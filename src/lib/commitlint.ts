/**
 * @since 2020-04-28 14:37
 * @author vivaxy
 */
import * as load from '@commitlint/load';

export async function getRules({ cwd }: { cwd: string }) {
  // @ts-ignore
  const rules: load.Rules = (await load({}, { cwd })).rules;
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
