import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply', async () => {
      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-456',
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      await replyRepositoryPostgres.addReply(newReply);

      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].content).toEqual('sebuah balasan');
      expect(replies[0].comment_id).toEqual('comment-123');
      expect(replies[0].owner).toEqual('user-456');
      expect(replies[0].is_delete).toEqual(false);
      expect(typeof replies[0].date).toEqual('string');
    });

    it('should return added reply correctly', async () => {
      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-456',
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-456',
      }));
    });
  });

  describe('verifyAvailableReply function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-xxx', 'comment-123'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when reply found', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-123', 'comment-123'))
        .resolves
        .not.toThrow(NotFoundError);
    });
  });

  describe('verifyAvailableReply function scoped to comment', () => {
    it('should throw NotFoundError when reply belongs to another comment', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-456', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-123', 'comment-123'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when user is not the reply owner', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123'))
        .rejects
        .toThrow(AuthorizationError);
    });

    it('should throw NotFoundError when reply not found', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-xxx', 'user-456'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should not throw AuthorizationError when user is the reply owner', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456'))
        .resolves
        .not.toThrow(AuthorizationError);
    });
  });

  describe('deleteReplyById function', () => {
    it('should soft delete the reply', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await replyRepositoryPostgres.deleteReplyById('reply-123');

      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
      expect(replies[0].content).toEqual('sebuah balasan');
    });

    it('should throw NotFoundError when reply not found', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.deleteReplyById('reply-xxx'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return an empty array when the thread has no reply', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      expect(replies).toEqual([]);
    });

    it('should return every reply of the thread ordered ascending by date', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123', owner: 'user-456' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        commentId: 'comment-456',
        owner: 'user-123',
        content: 'balasan kedua',
        date: '2021-08-08T08:07:01.522Z',
        isDelete: false,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        owner: 'user-456',
        content: 'balasan pertama',
        date: '2021-08-08T07:59:48.766Z',
        isDelete: true,
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      expect(replies).toStrictEqual([
        {
          id: 'reply-123',
          commentId: 'comment-123',
          content: 'balasan pertama',
          date: '2021-08-08T07:59:48.766Z',
          username: 'johndoe',
          isDelete: true,
        },
        {
          id: 'reply-456',
          commentId: 'comment-456',
          content: 'balasan kedua',
          date: '2021-08-08T08:07:01.522Z',
          username: 'dicoding',
          isDelete: false,
        },
      ]);
    });

    it('should not return replies that belong to another thread', async () => {
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({ id: 'comment-789', threadId: 'thread-456', owner: 'user-456' });
      await RepliesTableTestHelper.addReply({ id: 'reply-789', commentId: 'comment-789', owner: 'user-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      expect(replies).toEqual([]);
    });
  });
});
