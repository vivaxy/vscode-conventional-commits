/**
 * @since 2024-06-25 18:53
 * @author vivaxy
 */
import { expect, test, jest } from '@jest/globals';
import * as path from 'path';
import commitlint from '../commitlint';

jest.mock('../output', function () {
  return {
    info: jest.fn(),
    error: console.error,
    warning: console.warn,
  };
});

const fixtureRootPath = path.join(__dirname, 'fixtures');

test('should load commitlint@v17.8.1', async function () {
  await commitlint.loadRuleConfigs(
    path.join(fixtureRootPath, 'should-load-commitlint@v17.8.1'),
  );
  expect(commitlint.getTypeEnum()).toStrictEqual(['foo']);
});

test('should load commitlint@v19.3.1', async function () {
  await commitlint.loadRuleConfigs(
    path.join(fixtureRootPath, 'should-load-commitlint@v19.2.2'),
  );
  expect(commitlint.getTypeEnum()).toStrictEqual(['bar']);
});
