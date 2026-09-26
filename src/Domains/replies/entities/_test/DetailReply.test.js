import DetailReply from '../DetailReply.js';

describe('a DetailReply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
    };

    expect(() => new DetailReply(payload)).toThrow('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
      isDelete: 'true',
    };

    expect(() => new DetailReply(payload)).toThrow('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailReply object correctly when reply is not deleted', () => {
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T08:07:01.522Z',
      username: 'dicoding',
      isDelete: false,
    };

    const detailReply = new DetailReply(payload);

    expect(detailReply.id).toEqual(payload.id);
    expect(detailReply.content).toEqual('sebuah balasan');
    expect(detailReply.date).toEqual(payload.date);
    expect(detailReply.username).toEqual(payload.username);
    expect(detailReply.isDelete).toBeUndefined();
  });

  it('should mask the content when reply is deleted', () => {
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
      isDelete: true,
    };

    const detailReply = new DetailReply(payload);

    expect(detailReply.content).toEqual('**balasan telah dihapus**');
  });
});
