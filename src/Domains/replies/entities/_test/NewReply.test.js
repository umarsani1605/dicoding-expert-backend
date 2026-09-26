import NewReply from '../NewReply.js';

describe('a NewReply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      content: 'sebuah balasan',
    };

    expect(() => new NewReply(payload)).toThrow('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      content: 123,
      commentId: 'comment-123',
      owner: 'user-123',
    };

    expect(() => new NewReply(payload)).toThrow('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewReply object correctly', () => {
    const payload = {
      content: 'sebuah balasan',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const { content, commentId, owner } = new NewReply(payload);

    expect(content).toEqual(payload.content);
    expect(commentId).toEqual(payload.commentId);
    expect(owner).toEqual(payload.owner);
  });
});
