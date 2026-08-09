/**
 * @since 2024-06-25 18:53
 * @author vivaxy
 */
import { expect, test, vi } from 'vitest';
import * as path from 'path';
import commitlint from '../commitlint';
import * as output from '../output';

vi.mock('../output', function () {
  return {
    info: vi.fn(),
    error: vi.fn(console.error),
    warning: vi.fn(console.warn),
    appendLine: vi.fn(),
  };
});

const fixtureRootPath = path.join(__dirname, 'fixtures');
const repoRootPath = path.resolve(__dirname, '..', '..', '..');

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

test('should load @commitlint/config-conventional from the repo root config', async function () {
  await commitlint.loadRuleConfigs(repoRootPath);
  expect(commitlint.getTypeEnum()).toStrictEqual([
    'build',
    'chore',
    'ci',
    'docs',
    'feat',
    'fix',
    'perf',
    'refactor',
    'revert',
    'style',
    'test',
  ]);
});

// Regression tests for issue #391: cosmiconfig v9 lazy-requires parse-json and
// js-yaml. These must be bundled by webpack, not redirected to __non_webpack_require__.
test('should load JSON config (exercises cosmiconfig parse-json)', async function () {
  await commitlint.loadRuleConfigs(
    path.join(fixtureRootPath, 'should-load-json-config'),
  );
  expect(commitlint.getTypeEnum()).toStrictEqual(['json-type']);
});

test('should load YAML config (exercises cosmiconfig js-yaml)', async function () {
  await commitlint.loadRuleConfigs(
    path.join(fixtureRootPath, 'should-load-yaml-config'),
  );
  expect(commitlint.getTypeEnum()).toStrictEqual(['yaml-type']);
});

// Regression test for issue #395: jiti.cjs passes createRequire from node:module
// to _createJiti; webpack must not bundle node:module as a stub (TypeError: i.createRequire
// is not a function). Vitest runs un-bundled source, exercising the real jiti.cjs →
// node:module → createRequire chain directly.
test('should load TypeScript config (regression for issue #395 / jiti.cjs createRequire)', async function () {
  await commitlint.loadRuleConfigs(
    path.join(fixtureRootPath, 'should-load-ts-config'),
  );
  expect(commitlint.getTypeEnum()).toStrictEqual(['ts-type']);
});

// Regression test for issue #417: an extended config whose parserPreset
// resolves to a package with an ESM-only `exports` map (no `require`/
// `default` condition) makes @commitlint/resolve-extends throw
// ERR_PACKAGE_PATH_NOT_EXPORTED. loadRuleConfigs must still report the
// failure through a single toast, not two.
test('should report a single error when a parser preset is unresolvable (issue #417)', async function () {
  vi.mocked(output.error).mockClear();
  const rules = await commitlint.loadRuleConfigs(
    path.join(
      fixtureRootPath,
      'should-report-single-error-for-broken-parser-preset',
    ),
  );
  expect(rules).toStrictEqual({});
  expect(commitlint.getTypeEnum()).toStrictEqual([]);
  expect(output.error).toHaveBeenCalledTimes(1);
});
