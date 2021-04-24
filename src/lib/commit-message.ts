/**
 * @since 2020-07-06 23:02
 * @author vivaxy
 */
export class CommitMessage {
  private _type: string = '';
  private _scope: string = '';
  private _breakingChange: string = '';
  private _gitmoji: string = '';
  private _subject: string = '';
  private _body: string = '';
  private _footer: string = '';

  get type() {
    return this._type;
  }

  set type(input: string) {
    this._type = input.trim();
  }

  get scope() {
    return this._scope;
  }

  set scope(input: string) {
    this._scope = input.trim();
  }

  get breakingChange() {
    return this._breakingChange;
  }

  set breakingChange(input: string) {
    this._breakingChange = input.trim();
  }

  get gitmoji() {
    return this._gitmoji;
  }

  set gitmoji(input: string) {
    this._gitmoji = input.trim();
  }

  get subject() {
    return this._subject;
  }

  set subject(input: string) {
    this._subject = input.trim();
  }

  get body() {
    return this._body;
  }

  set body(input: string) {
    this._body = input.trim();
  }
  get footer() {
    return this._footer;
  }

  set footer(input: string) {
    this._footer = input.trim();
  }
}

export function serializeSubject(partialCommitMessage: {
  gitmoji: string;
  subject: string;
}) {
  let result = '';
  const { gitmoji, subject } = partialCommitMessage;
  if (gitmoji) {
    result += `${gitmoji}`;
  }
  if (gitmoji && subject) {
    result += ' ';
  }
  if (subject) {
    result += subject;
  }
  return result;
}

export function serializeHeader({
  partialCommitMessage,
  detectBreakingChange,
}: {
  partialCommitMessage: {
    type: string;
    scope: string;
    breakingChange: string;
    gitmoji: string;
    subject: string;
  };
  detectBreakingChange: boolean;
}) {
  let result = '' + partialCommitMessage.type;

  const { scope, breakingChange } = partialCommitMessage;
  if (scope) result += `(${scope})`;

  if (breakingChange && (breakingChange === '!' || detectBreakingChange)) {
    result += `!: `;
  } else result += ': ';

  const subject = serializeSubject(partialCommitMessage);
  if (subject) result += subject;

  return result;
}

export function serialize(
  commitMessage: CommitMessage,
  detectBreakingChange: boolean,
) {
  let message = serializeHeader({
    partialCommitMessage: commitMessage,
    detectBreakingChange,
  });
  const { breakingChange, body, footer } = commitMessage;
  if (body) message += `\n\n${body}`;

  if (breakingChange && breakingChange != '!') {
    message += `\n\n${breakingChange}`;
  }
  if (footer) {
    message += breakingChange && breakingChange != '!' ? '\n' : '\n\n';
    message += footer;
  }
  return message;
}
