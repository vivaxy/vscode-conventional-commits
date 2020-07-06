/**
 * @since 2020-07-06 23:02
 * @author vivaxy
 */
type CommitMessage = {
  type: string;
  scope: string;
  gitmoji: string;
  subject: string;
  body: string;
  footer: string;
};

export default CommitMessage;
