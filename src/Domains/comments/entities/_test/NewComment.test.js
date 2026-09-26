import NewComment from '../NewComment.js';

describe('a NewComment entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      content: 'sebuah comment',
    };

    expect(() => new NewComment(payload)).toThrow('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      content: ['sebuah comment'],
      threadId: 'thread-123',
      owner: 'user-123',
    };

    expect(() => new NewComment(payload)).toThrow('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewComment object correctly', () => {
    const payload = {
      content: 'sebuah comment',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    const { content, threadId, owner } = new NewComment(payload);

    expect(content).toEqual(payload.content);
    expect(threadId).toEqual(payload.threadId);
    expect(owner).toEqual(payload.owner);
  });
});
