import NewThread from '../NewThread.js';

describe('a NewThread entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      title: 'sebuah thread',
    };

    expect(() => new NewThread(payload)).toThrow('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      title: 123,
      body: 'sebuah body thread',
      owner: 'user-123',
    };

    expect(() => new NewThread(payload)).toThrow('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when title contains more than 150 character', () => {
    const payload = {
      title: 'a'.repeat(151),
      body: 'sebuah body thread',
      owner: 'user-123',
    };

    expect(() => new NewThread(payload)).toThrow('NEW_THREAD.TITLE_LIMIT_CHAR');
  });

  it('should create NewThread object correctly', () => {
    const payload = {
      title: 'sebuah thread',
      body: 'sebuah body thread',
      owner: 'user-123',
    };

    const { title, body, owner } = new NewThread(payload);

    expect(title).toEqual(payload.title);
    expect(body).toEqual(payload.body);
    expect(owner).toEqual(payload.owner);
  });
});
