/**
 * End-to-end test for the `extension.conventionalCommits` command.
 *
 * Runs inside the VS Code extension host launched by `@vscode/test-electron`.
 * Drives the prompt machine with stubbed answers, executes the command
 * against the mock git repository provisioned by the launcher, and asserts
 * that:
 *   1. the extension activated,
 *   2. the command is registered with VS Code,
 *   3. `repository.inputBox.value` was set to the expected serialized
 *      conventional-commits message at the time the prompt machine resolved,
 *   4. `git log -1 --pretty=%B` on the mock repo shows a real new commit
 *      whose message matches the conventional-commits regex and contains the
 *      test subject.
 */

import * as assert from 'assert';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

import { installPromptStubs, PromptStubs } from './stub-prompts';

// --- VS Code Git API surface we touch (typed loosely) ----------------------
// The vendored `src/vendors/git.d.ts` is intentionally a frozen subset and
// does not include `add(paths)` on `Repository`, even though the runtime
// API exposes it. Define the minimal shape we need here.
interface GitInputBox {
  value: string;
}

interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly inputBox: GitInputBox;
  add(paths: string[]): Promise<void>;
}

interface GitAPI {
  readonly repositories: GitRepository[];
}

interface VscodeGitExports {
  getAPI(version: 1): GitAPI;
}

const EXTENSION_ID = 'vivaxy.vscode-conventional-commits';
const COMMAND_ID = 'extension.conventionalCommits';

/** Sleep helper for polling. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until `predicate()` returns a truthy value or `timeoutMs` elapses.
 * Returns the truthy value, or rejects with the latest error / a timeout
 * error.
 */
async function waitFor<T>(
  predicate: () => T | undefined | Promise<T | undefined>,
  {
    timeoutMs,
    intervalMs = 200,
    description,
  }: { timeoutMs: number; intervalMs?: number; description: string },
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) {
        return value as T;
      }
    } catch (err) {
      lastErr = err;
    }
    await delay(intervalMs);
  }
  const detail = lastErr instanceof Error ? `: ${lastErr.message}` : '';
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for ${description}${detail}`,
  );
}

suite('extension.conventionalCommits e2e', () => {
  let repoPath: string;
  let repository: GitRepository;
  let gitApi: GitAPI;
  let stubs: PromptStubs | undefined;
  // Captured value of `repository.inputBox.value` the moment production code
  // assigned it. We trap the setter rather than read after `executeCommand`
  // resolves because `git.commit` clears the input box on success.
  let capturedInputBoxValue: string | undefined;

  suiteSetup(async function () {
    this.timeout(60000);

    // Tee any output channel produced by the extension under test to the
    // node-side console so e2e log review surfaces extension diagnostics
    // (the production code routes errors via `output.appendLine` to a
    // VS Code OutputChannel that test assertions cannot otherwise read).
    const originalCreateOutputChannel = vscode.window.createOutputChannel;
    (
      vscode.window as unknown as {
        createOutputChannel: typeof vscode.window.createOutputChannel;
      }
    ).createOutputChannel = function (
      name: string,
      ...rest: unknown[]
    ): vscode.OutputChannel {
      const channel = (originalCreateOutputChannel as Function).call(
        vscode.window,
        name,
        ...rest,
      ) as vscode.OutputChannel;
      const originalAppendLine = channel.appendLine.bind(channel);
      channel.appendLine = (line: string) => {
        console.log(`[ext-output:${name}] ${line}`);
        originalAppendLine(line);
      };
      return channel;
    };

    // Surface any user-facing error popups to the test log too — the
    // production code calls `vscode.window.showErrorMessage` from inside its
    // catch blocks, and we need to see those when diagnosing.
    const originalShowErrorMessage = vscode.window.showErrorMessage;
    (
      vscode.window as unknown as {
        showErrorMessage: typeof vscode.window.showErrorMessage;
      }
    ).showErrorMessage = function (
      message: string,
      ...rest: unknown[]
    ): Thenable<string | undefined> {
      console.log(`[ext-error] ${message}`);
      return (originalShowErrorMessage as Function).call(
        vscode.window,
        message,
        ...rest,
      );
    };

    repoPath = process.env.MOCK_REPO_PATH || '';
    assert.ok(
      repoPath,
      'MOCK_REPO_PATH env var must be set by the e2e launcher',
    );

    // 1. Wait for the bundled git extension to activate. The host loads it
    //    automatically as a built-in (the `--disable-extensions` flag does
    //    not apply to built-ins).
    const gitExtension =
      vscode.extensions.getExtension<VscodeGitExports>('vscode.git');
    assert.ok(gitExtension, 'vscode.git extension must be available');
    if (!gitExtension.isActive) {
      await gitExtension.activate();
    }

    gitApi = gitExtension.exports.getAPI(1);

    // 2. Wait until the Git API has discovered the workspace folder as a
    //    repository. Folder discovery is async and timing varies across
    //    VS Code releases, so poll instead of relying on
    //    `onDidOpenRepository`.
    repository = await waitFor<GitRepository>(
      () =>
        gitApi.repositories.find((repo) => repo.rootUri.fsPath === repoPath),
      {
        timeoutMs: 30000,
        description: `git.repositories to contain ${repoPath}`,
      },
    );

    // 3. Activate the extension under test up front so step (i) of the
    //    assertions has something to look at, and so that the very first
    //    `executeCommand` call below does not race the activation event.
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} must be present`);
    if (!ext.isActive) {
      await ext.activate();
    }
  });

  teardown(() => {
    if (stubs) {
      stubs.dispose();
      stubs = undefined;
    }
  });

  test('runs the full conventional-commit flow', async function () {
    this.timeout(60000);

    // (i) Extension activated.
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} must be present`);
    assert.strictEqual(ext.isActive, true, 'extension should be active');

    // (ii) Command registered.
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes(COMMAND_ID),
      `command ${COMMAND_ID} should be registered`,
    );

    // ----------------------------------------------------------------------
    // Set up the inputBox.value capture before kicking off the command. The
    // production code sets `repository.inputBox.value = serialized` and then
    // (with autoCommit on, the default) calls `git.commit`, which clears
    // the value. Trap the setter on the *Repository* prototype's `inputBox`
    // accessor so we observe every `repository.inputBox.value = …` write,
    // even if `repository.inputBox` returns a fresh object each call.
    // Climb the prototype chain to locate where `inputBox` is actually
    // declared. The VS Code git extension wraps the underlying source-control
    // input box behind a getter on `Repository.prototype`, but in newer VS
    // Code releases that getter may live further up the chain.
    const findOwner = (obj: object | null, prop: string): object | null => {
      let cur: object | null = obj;
      while (cur) {
        if (Object.prototype.hasOwnProperty.call(cur, prop)) return cur;
        cur = Object.getPrototypeOf(cur);
      }
      return null;
    };
    const repoProto = findOwner(repository, 'inputBox') ?? repository;
    console.log(
      '[e2e diagnostic] repo prototype owning inputBox:',
      repoProto === repository ? '<repository itself>' : '<prototype>',
      'descriptor keys:',
      Object.getOwnPropertyDescriptor(repoProto, 'inputBox')
        ? Object.keys(Object.getOwnPropertyDescriptor(repoProto, 'inputBox')!)
        : '<none>',
    );
    const originalInputBoxDescriptor = Object.getOwnPropertyDescriptor(
      repoProto,
      'inputBox',
    );
    const wrapInputBox = (box: GitInputBox): GitInputBox =>
      new Proxy(box, {
        set(target, prop, value, receiver) {
          if (prop === 'value' && typeof value === 'string' && value !== '') {
            capturedInputBoxValue = value;
          }
          return Reflect.set(target, prop, value, receiver);
        },
      });
    if (originalInputBoxDescriptor && originalInputBoxDescriptor.get) {
      const origGet = originalInputBoxDescriptor.get;
      Object.defineProperty(repoProto, 'inputBox', {
        configurable: true,
        enumerable: originalInputBoxDescriptor.enumerable,
        get() {
          return wrapInputBox(origGet.call(this) as GitInputBox);
        },
      });
    } else {
      // Fallback: trap directly on the current inputBox object.
      const inputBoxRef = repository.inputBox as GitInputBox;
      const valueOwner = findOwner(inputBoxRef, 'value') ?? inputBoxRef;
      const valueDescriptor = Object.getOwnPropertyDescriptor(
        valueOwner,
        'value',
      );
      console.log(
        '[e2e diagnostic] inputBox value descriptor on',
        valueOwner === inputBoxRef ? '<own>' : '<prototype>',
        valueDescriptor ? Object.keys(valueDescriptor) : '<none>',
      );
      if (valueDescriptor && valueDescriptor.set) {
        const origSet = valueDescriptor.set;
        const origGet = valueDescriptor.get;
        Object.defineProperty(valueOwner, 'value', {
          configurable: true,
          enumerable: valueDescriptor.enumerable,
          get() {
            return origGet ? origGet.call(this) : undefined;
          },
          set(next: string) {
            if (typeof next === 'string' && next !== '') {
              capturedInputBoxValue = next;
            }
            origSet.call(this, next);
          },
        });
      } else {
        let backingValue = inputBoxRef.value;
        Object.defineProperty(inputBoxRef, 'value', {
          configurable: true,
          enumerable: true,
          get() {
            return backingValue;
          },
          set(next: string) {
            backingValue = next;
            if (typeof next === 'string' && next !== '') {
              capturedInputBoxValue = next;
            }
          },
        });
      }
    }
    const originalDescriptor = originalInputBoxDescriptor;

    try {
      // ----- script the prompts (default config: gitmoji off, scope on, ci
      // off, body on, footer on, showEditor off, autoCommit on, emojiFormat
      // 'code'). Order from src/lib/prompts.ts after filtering:
      //   1. type     QuickPick   → 'feat'
      //   2. scope    QuickPick   → '' (no scope; stub maps to noneItem)
      //   3. subject  InputBox    → 'add e2e harness'
      //   4. body     InputBox    → ''
      //   5. footer   InputBox    → ''
      stubs = installPromptStubs(['feat', '', 'add e2e harness', '', '']);

      // Edit the tracked file so there is a working-tree change to stage.
      const trackedFileUri = vscode.Uri.file(path.join(repoPath, 'README.md'));
      const newContents = Buffer.from(
        '# E2E mock repo\n\ne2e edit ' + Date.now() + '\n',
        'utf8',
      );
      await vscode.workspace.fs.writeFile(trackedFileUri, newContents);

      // Stage via the Git API. `git.commit` honours
      // `git.enableSmartCommit` (default false), so it requires staged
      // changes — staging here keeps the test independent of user
      // settings.
      await repository.add([trackedFileUri.fsPath]);

      // Drive the command. Passing the repository's `rootUri` short-circuits
      // the multi-repo quick-pick branch in `getRepository`.
      await vscode.commands.executeCommand(COMMAND_ID, repository.rootUri);
    } finally {
      // Restore the original `inputBox` accessor on the prototype if we
      // installed our own.
      if (originalDescriptor) {
        Object.defineProperty(repoProto, 'inputBox', originalDescriptor);
      }
    }

    // Diagnostic dump for debugging the prompt-stub interaction in CI.
    console.log(
      '[e2e diagnostic] prompt captures:',
      JSON.stringify(stubs.captures, null, 2),
    );
    console.log(
      '[e2e diagnostic] capturedInputBoxValue:',
      JSON.stringify(capturedInputBoxValue),
    );
    console.log(
      '[e2e diagnostic] remaining scripted answers:',
      stubs.remaining(),
    );

    // (iii) inputBox.value matched the expected serialized message at the
    //       time the prompt machine resolved.
    const expectedMessage = 'feat: add e2e harness';
    assert.strictEqual(
      capturedInputBoxValue,
      expectedMessage,
      `repository.inputBox.value should have been set to ${JSON.stringify(
        expectedMessage,
      )} during the run`,
    );

    // (iv) A new commit landed on HEAD. Auto-commit is on by default, so
    //      the command flow should have run `git.commit` after setting
    //      the input box. Read the latest commit message via the git CLI.
    const headMessage = execFileSync('git', ['log', '-1', '--pretty=%B'], {
      cwd: repoPath,
    })
      .toString()
      .trim();

    assert.match(
      headMessage,
      /^feat: add e2e harness/,
      `HEAD commit message should match the conventional-commits header — got ${JSON.stringify(
        headMessage,
      )}`,
    );
    assert.ok(
      headMessage.includes('add e2e harness'),
      `HEAD commit message should contain the test subject — got ${JSON.stringify(
        headMessage,
      )}`,
    );

    // Bonus: confirm the prompt machine consumed every scripted answer in
    // the expected order — surfaces silent skipped/extra steps in CI logs.
    assert.strictEqual(
      stubs.remaining(),
      0,
      `all scripted prompt answers should have been consumed; remaining=${stubs.remaining()}`,
    );
  });
});
