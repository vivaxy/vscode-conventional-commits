/**
 * @since 2020-07-06 23:02
 * @author vivaxy
 */
export class CommitMessage {
  private _type: string = '';
  private _scope: string = '';
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

export default new CommitMessage();

export function serializeSubject(partialCommitMessage: {
  gitmoji: string;
  subject: string;
}) {
  let result = '';
  if (partialCommitMessage.gitmoji) {
    result += `${partialCommitMessage.gitmoji}`;
  }
  if (partialCommitMessage.gitmoji && partialCommitMessage.subject) {
    result += ' ';
  }
  if (partialCommitMessage.subject) {
    result += partialCommitMessage.subject;
  }
  return result;
}

export function serialize(commitMessage: CommitMessage) {
  let message = '';
  message += commitMessage.type;
  const scope = commitMessage.scope;
  if (scope) {
    message += `(${scope})`;
  }
  message += ': ';
  const subject = serializeSubject(commitMessage);
  if (subject) {
    message += subject;
  }
  const body = commitMessage.body;
  if (body) {
    message += `\n\n${body}`;
  }
  const footer = commitMessage.footer;
  if (footer) {
    message += `\n\n${footer}`;
  }
  return message;
}
