/**
 * @since 2020-04-28 14:37
 * @author vivaxy
 */
import load from '@commitlint/load/lib/load';
import rules from '@commitlint/rules';
import { RulesConfig, RuleConfigSeverity } from '@commitlint/types/lib/rules';
import { UserPromptConfig } from '@commitlint/types/lib/prompt';
// `Commit` is intentionally a minimal local shape covering only the fields
// the lint helpers below cast through. @commitlint/types v20 stopped
// re-exporting `Commit` from `parse.d.ts`, and conventional-commits-parser v4
// (the upstream source) ships without type declarations.
type Commit = {
  type?: string | null;
  scope?: string | null;
  subject?: string | null;
  header?: string | null;
  body?: string | null;
  footer?: string | null;
};
import * as output from './output';

// `ERR_PACKAGE_PATH_NOT_EXPORTED` is Node's stable error code (not just a
// message string) for a `require()` resolution hitting a package.json
// `exports` map that has no `require`/`default` condition — e.g. a pure-ESM
// package. commitlint hits this via `@commitlint/resolve-extends`'s
// `parserPreset` resolution (see issue #417): `@commitlint/config-conventional`
// sets `parserPreset: 'conventional-changelog-conventionalcommits'`, and if a
// project's installed copy of that package is v10.x, its `exports` field is
// `{"import": "./src/index.js"}` with no CJS fallback.
function formatUnexportedPackageError(e: NodeJS.ErrnoException): string {
  const match = e.message.match(/[\\/]([^\\/]+)[\\/]package\.json$/);
  const packageName = match ? match[1] : undefined;
  if (packageName === 'conventional-changelog-conventionalcommits') {
    return (
      `commitlint: "conventional-changelog-conventionalcommits" ships an ESM-only "exports" field ` +
      `(no "require"/"default" condition), so Node cannot load it here. This is a known upstream ` +
      `commitlint issue (https://github.com/conventional-changelog/commitlint/issues/4864) with no fix yet. ` +
      `Workaround: pin "conventional-changelog-conventionalcommits" to "9.3.1" in your project, e.g. via ` +
      `"resolutions" in package.json (Yarn) or "overrides" (npm).`
    );
  }
  return (
    `commitlint: ${packageName ?? 'a commitlint config dependency'} ships an ESM-only "exports" field ` +
    `(no "require"/"default" condition), so Node cannot load it here. Pinning that package to a version ` +
    `with a CommonJS-compatible "exports" field should resolve this.`
  );
}

class Commitlint {
  private ruleConfigs: Partial<RulesConfig> = {};
  private promptConfig?: UserPromptConfig;

  async loadRuleConfigs(cwd: string): Promise<Partial<RulesConfig>> {
    async function getRuleConfigs() {
      try {
        const { rules, prompt } = await load({}, { cwd });
        output.info('Load commitlint configuration successfully.');
        return { rules, prompt };
      } catch (e) {
        if (e instanceof Error) {
          // Catch if `Cannot find module "@commitlint/config-conventional"` happens.
          if (e.message.startsWith('Cannot find module')) {
            output.warning(`commitlint: The cwd is ${cwd}`);
            output.warning(`commitlint: ${e.message}`);
          } else if (
            (e as NodeJS.ErrnoException).code ===
            'ERR_PACKAGE_PATH_NOT_EXPORTED'
          ) {
            output.appendLine(`[error] commitlint: The cwd is ${cwd}`);
            output.appendLine(`[error] commitlint: ${e.stack}`);
            // Not break even if it gets configuration failure.
            output.error(
              'commitlint',
              formatUnexportedPackageError(e as NodeJS.ErrnoException),
            );
          } else {
            output.appendLine(`[error] commitlint: The cwd is ${cwd}`);
            // Not break even if it gets configuration failure.
            output.error('commitlint', e);
          }
        } else {
          output.error('commitlint', `Unknown error: ${e}`);
        }
        return { rules: {}, prompt: undefined };
      }
    }
    const { rules, prompt } = await getRuleConfigs();
    this.ruleConfigs = rules;
    this.promptConfig = prompt;
    return this.ruleConfigs;
  }

  private getEnum(key: keyof RulesConfig) {
    const config = this.ruleConfigs[key];
    if (!config) {
      return [];
    }
    // @ts-ignore
    const [level, condition, value] = config;
    if (level !== RuleConfigSeverity.Error) {
      return [];
    }
    if (condition === 'never') {
      return [];
    }
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map(function (item) {
      return String(item);
    });
  }

  private lintRule(commit: Commit, key: keyof RulesConfig) {
    if (!this.ruleConfigs[key]) {
      return '';
    }
    // @ts-ignore
    const [level, condition, value] = this.ruleConfigs[key];
    if (level !== RuleConfigSeverity.Error) {
      return '';
    }
    // @ts-ignore
    const [valid, error] = rules[key](commit, condition, value);
    return valid ? '' : error;
  }

  private lintRules(commit: Commit, keys: (keyof RulesConfig)[]) {
    for (const key of keys) {
      const error = this.lintRule(commit, key);
      if (error) {
        return error;
      }
    }
    return '';
  }

  getTypeEnum() {
    return this.getEnum('type-enum');
  }

  getScopeEnum() {
    return this.getEnum('scope-enum');
  }

  lintType(type: string) {
    return this.lintRules({ type } as Commit, [
      'type-enum',
      'type-case',
      'type-empty',
      'type-min-length',
      'type-max-length',
    ]);
  }

  lintScope(scope: string) {
    return this.lintRules({ scope } as Commit, [
      'scope-enum',
      'scope-case',
      'scope-empty',
      'scope-max-length',
      'scope-min-length',
    ]);
  }

  lintSubject(subject: string) {
    return this.lintRules({ subject } as Commit, [
      'subject-case',
      'subject-empty',
      'subject-full-stop',
      'subject-min-length',
      'subject-max-length',
    ]);
  }

  lintHeader(header: string) {
    return this.lintRules({ header } as Commit, [
      'header-case',
      'header-full-stop',
      'header-max-length',
      'header-min-length',
    ]);
  }

  lintBody(body: string) {
    return this.lintRules({ body } as Commit, [
      'body-full-stop',
      'body-min-length',
      'body-max-length',
    ]);
  }

  lintFooter(footer: string) {
    return this.lintRules({ footer } as Commit, [
      'footer-min-length',
      'footer-max-length',
    ]);
  }

  getPromptConfig() {
    return this.promptConfig;
  }
}

export default new Commitlint();
