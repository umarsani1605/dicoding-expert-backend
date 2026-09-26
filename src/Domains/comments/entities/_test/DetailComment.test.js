import DetailComment from '../DetailComment.js';

describe('a DetailComment entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
    };

    expect(() => new DetailComment(payload)).toThrow('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      isDelete: 'false',
    };

    expect(() => new DetailComment(payload)).toThrow('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when replies is not an array', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      isDelete: false,
      replies: 'bukan array',
    };

    expect(() => new DetailComment(payload)).toThrow('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when likeCount is not a number', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      isDelete: false,
      likeCount: '2',
    };

    expect(() => new DetailComment(payload)).toThrow('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailComment object correctly when comment is not deleted', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      isDelete: false,
      replies: [{ id: 'reply-123' }],
      likeCount: 2,
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.date).toEqual(payload.date);
    expect(detailComment.content).toEqual('sebuah comment');
    expect(detailComment.replies).toEqual(payload.replies);
    expect(detailComment.likeCount).toEqual(2);
    expect(detailComment.isDelete).toBeUndefined();
  });

  it('should default replies to an empty array and likeCount to zero', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      isDelete: false,
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.replies).toEqual([]);
    expect(detailComment.likeCount).toEqual(0);
  });

  it('should mask the content when comment is deleted', () => {
    const payload = {
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
      isDelete: true,
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.content).toEqual('**komentar telah dihapus**');
    expect(detailComment.replies).toEqual([]);
  });
});
