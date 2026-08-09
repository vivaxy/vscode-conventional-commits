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
// failure through a single toast, not two, and the toast must explain the
// ESM-only-exports cause rather than surface the raw Node error text.
test('should report a single, explanatory error when a parser preset is unresolvable (issue #417)', async function () {
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
  const [, message] = vi.mocked(output.error).mock.calls[0];
  expect(message).toContain('pkg-esm-only');
  expect(message).toContain('ESM-only "exports" field');
});

// Regression test for issue #417: when the unresolvable parserPreset is
// specifically `conventional-changelog-conventionalcommits` (the package
// @commitlint/config-conventional sets as its parserPreset, and whose v10.x
// releases ship an ESM-only `exports` map), the toast must name the known
// upstream commitlint bug and the documented workaround (pin to 9.3.1)
// instead of a generic message.
test('should report an actionable error naming the pin-to-9.3.1 workaround for conventional-changelog-conventionalcommits (issue #417)', async function () {
  vi.mocked(output.error).mockClear();
  const rules = await commitlint.loadRuleConfigs(
    path.join(
      fixtureRootPath,
      'should-report-actionable-error-for-conventionalcommits-preset',
    ),
  );
  expect(rules).toStrictEqual({});
  expect(commitlint.getTypeEnum()).toStrictEqual([]);
  expect(output.error).toHaveBeenCalledTimes(1);
  const [, message] = vi.mocked(output.error).mock.calls[0];
  expect(message).toContain('conventional-changelog-conventionalcommits');
  expect(message).toContain('9.3.1');
  expect(message).toContain(
    'https://github.com/conventional-changelog/commitlint/issues/4864',
  );
});
