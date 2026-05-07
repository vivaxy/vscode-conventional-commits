import { expect, test } from 'vitest';
import {
  CommitMessage,
  serializeSubject,
  serializeHeader,
  serialize,
} from '../commit-message';

test('CommitMessage trims whitespace around type', function () {
  const commitMessage = new CommitMessage();
  commitMessage.type = '  feat  ';
  expect(commitMessage.type).toBe('feat');
});

test('CommitMessage trims whitespace around scope', function () {
  const commitMessage = new CommitMessage();
  commitMessage.scope = '  scope  ';
  expect(commitMessage.scope).toBe('scope');
});

test('CommitMessage trims whitespace around gitmoji', function () {
  const commitMessage = new CommitMessage();
  commitMessage.gitmoji = '  :sparkles:  ';
  expect(commitMessage.gitmoji).toBe(':sparkles:');
});

test('CommitMessage trims whitespace around subject', function () {
  const commitMessage = new CommitMessage();
  commitMessage.subject = '  add login  ';
  expect(commitMessage.subject).toBe('add login');
});

test('CommitMessage trims whitespace around body', function () {
  const commitMessage = new CommitMessage();
  commitMessage.body = '  body content  ';
  expect(commitMessage.body).toBe('body content');
});

test('CommitMessage trims whitespace around footer', function () {
  const commitMessage = new CommitMessage();
  commitMessage.footer = '  BREAKING CHANGE: api  ';
  expect(commitMessage.footer).toBe('BREAKING CHANGE: api');
});

test('CommitMessage trims whitespace around ci', function () {
  const commitMessage = new CommitMessage();
  commitMessage.ci = '  Yes  ';
  expect(commitMessage.ci).toBe('Yes');
});

test('serializeSubject returns gitmoji alone when subject is empty', function () {
  expect(serializeSubject({ gitmoji: ':sparkles:', subject: '' })).toBe(
    ':sparkles:',
  );
});

test('serializeSubject returns subject alone when gitmoji is empty', function () {
  expect(serializeSubject({ gitmoji: '', subject: 'add login' })).toBe(
    'add login',
  );
});

test('serializeSubject joins gitmoji and subject with a single space', function () {
  expect(
    serializeSubject({ gitmoji: ':sparkles:', subject: 'add login' }),
  ).toBe(':sparkles: add login');
});

test('serializeSubject returns empty string when both gitmoji and subject are empty', function () {
  expect(serializeSubject({ gitmoji: '', subject: '' })).toBe('');
});

test('serializeHeader renders type-only header', function () {
  expect(
    serializeHeader({
      ci: '',
      type: 'feat',
      scope: '',
      gitmoji: '',
      subject: '',
    }),
  ).toBe('feat: ');
});

test('serializeHeader renders type and scope', function () {
  expect(
    serializeHeader({
      ci: '',
      type: 'feat',
      scope: 'scope',
      gitmoji: '',
      subject: '',
    }),
  ).toBe('feat(scope): ');
});

test('serializeHeader renders type, scope, gitmoji, and subject', function () {
  expect(
    serializeHeader({
      ci: '',
      type: 'feat',
      scope: 'scope',
      gitmoji: ':sparkles:',
      subject: 'add login',
    }),
  ).toBe('feat(scope): :sparkles: add login');
});

test('serializeHeader appends [skip ci] when ci is Yes', function () {
  expect(
    serializeHeader({
      ci: 'Yes',
      type: 'feat',
      scope: 'scope',
      gitmoji: ':sparkles:',
      subject: 'add login',
    }),
  ).toBe('feat(scope): :sparkles: add login [skip ci]');
});

test('serialize renders header-only message', function () {
  const commitMessage = new CommitMessage();
  commitMessage.type = 'feat';
  commitMessage.scope = 'scope';
  commitMessage.gitmoji = ':sparkles:';
  commitMessage.subject = 'add login';
  expect(serialize(commitMessage)).toBe('feat(scope): :sparkles: add login');
});

test('serialize joins header and body with a blank line', function () {
  const commitMessage = new CommitMessage();
  commitMessage.type = 'feat';
  commitMessage.scope = 'scope';
  commitMessage.gitmoji = ':sparkles:';
  commitMessage.subject = 'add login';
  commitMessage.body = 'body content';
  expect(serialize(commitMessage)).toBe(
    'feat(scope): :sparkles: add login\n\nbody content',
  );
});

test('serialize joins header and footer with a blank line', function () {
  const commitMessage = new CommitMessage();
  commitMessage.type = 'feat';
  commitMessage.scope = 'scope';
  commitMessage.gitmoji = ':sparkles:';
  commitMessage.subject = 'add login';
  commitMessage.footer = 'BREAKING CHANGE: api';
  expect(serialize(commitMessage)).toBe(
    'feat(scope): :sparkles: add login\n\nBREAKING CHANGE: api',
  );
});

test('serialize joins header, body, and footer with blank lines', function () {
  const commitMessage = new CommitMessage();
  commitMessage.type = 'feat';
  commitMessage.scope = 'scope';
  commitMessage.gitmoji = ':sparkles:';
  commitMessage.subject = 'add login';
  commitMessage.body = 'body content';
  commitMessage.footer = 'BREAKING CHANGE: api';
  expect(serialize(commitMessage)).toBe(
    'feat(scope): :sparkles: add login\n\nbody content\n\nBREAKING CHANGE: api',
  );
});
