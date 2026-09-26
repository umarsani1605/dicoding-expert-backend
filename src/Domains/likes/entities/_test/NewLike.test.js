import NewLike from '../NewLike.js';

describe('a NewLike entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      commentId: 'comment-123',
    };

    expect(() => new NewLike(payload)).toThrow('NEW_LIKE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      commentId: 'comment-123',
      owner: 123,
    };

    expect(() => new NewLike(payload)).toThrow('NEW_LIKE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewLike object correctly', () => {
    const payload = {
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const { commentId, owner } = new NewLike(payload);

    expect(commentId).toEqual(payload.commentId);
    expect(owner).toEqual(payload.owner);
  });
});
