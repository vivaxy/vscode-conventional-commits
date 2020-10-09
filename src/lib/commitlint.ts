/**
 * @since 2020-04-28 14:37
 * @author vivaxy
 */
import load from '@commitlint/load';
import rules from '@commitlint/rules';
import { RulesConfig, RuleConfigSeverity } from '@commitlint/types/lib/rules';
import { Commit } from '@commitlint/types/lib/parse';

class Commitlint {
  private ruleConfigs: Partial<RulesConfig> = {};

  async loadRuleConfigs(cwd: string): Promise<Partial<RulesConfig>> {
    async function getRuleConfigs() {
      try {
        const { rules } = await load({}, { cwd });
        return rules;
      } catch (e) {
        // catch if `Cannot find module "@commitlint/config-conventional"` happens.
        return {};
      }
    }
    this.ruleConfigs = await getRuleConfigs();
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

  lintBody(body: string) {
    return this.lintRules({ body } as Commit, [
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
}

export default new Commitlint();
