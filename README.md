# VSCode Conventional Commits

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/vivaxy.vscode-conventional-commits.svg)](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/vivaxy.vscode-conventional-commits.svg)](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits)

[Conventional Commits](https://www.conventionalcommits.org/) for VSCode.

## Features

This extension helps you to fill in commit message according to
[Conventional Commits](https://www.conventionalcommits.org/).

- Respect commitlint configs.
- Support auto commit and push after typing messages. See
  [Commit Workflow](#commit-workflow) for details.
- Support project level scope management.
- Support gitmojis.

## Usage

![Demo](./assets/docs/demo.gif)

You can access VSCode Conventional Commits in two ways:

1. `Command + Shift + P` or `Ctrl + Shift + P`, enter `Conventional Commits`,
   and press `Enter`.
2. Click the icon on the Source Control menu. See the image below.

<img src="./assets/docs/icon-on-the-source-control-menu.png" alt="Icon on the Source Control menu" width="300">

## Commit Workflow

The recommended workflow automatically add, commit and push files by default.

If you only want the extension to fill in the message, disable `autoCommit`
configuration.

### The Recommended Workflow

1. Active the extension.
2. Type messages.

The extension will automatically add the changed files, perform the commit and
push the commit to remote.

### How To Configure

1. Enable `autoCommit` configuration of the extension. _The extension enables
   `autoCommit` by default._
2. Enable `git.enableSmartCommit` and set `git.smartCommitChanges` to `all` to
   commit all changes when there are no staged changes.
3. Set `Settings > git.postCommitCommand` to `sync` to run `git.sync` after
   commit.

## Related Projects

- [gacp](https://github.com/vivaxy/gacp)
- [Commit Tagger](https://github.com/Mongkii/Commit-Tagger)
- [vscode-commitizen](https://github.com/KnisterPeter/vscode-commitizen)

## Troubleshooting

1. Switch to the VSCode `OUTPUT` tab, select `Conventional Commits`.
2. Copy all the output. Before sharing it, make sure you have omitted some
   private date.

![Debug instruction](./assets/docs/debug-instruction.png)

## FAQ

1. How to add a line break in messages?

Set `lineBreak` configuration to `\n`. When you're typing, enter `\n` as a line
break.
