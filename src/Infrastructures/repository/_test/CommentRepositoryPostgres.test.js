import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment', async () => {
      const newComment = new NewComment({
        content: 'sebuah comment',
        threadId: 'thread-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await commentRepositoryPostgres.addComment(newComment);

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toEqual('sebuah comment');
      expect(comments[0].thread_id).toEqual('thread-123');
      expect(comments[0].owner).toEqual('user-123');
      expect(comments[0].is_delete).toEqual(false);
      expect(typeof comments[0].date).toEqual('string');
    });

    it('should return added comment correctly', async () => {
      const newComment = new NewComment({
        content: 'sebuah comment',
        threadId: 'thread-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyAvailableComment function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyAvailableComment('comment-xxx', 'thread-123'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when comment found', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyAvailableComment('comment-123', 'thread-123'))
        .resolves
        .not.toThrow(NotFoundError);
    });
  });

  describe('verifyAvailableComment function scoped to thread', () => {
    it('should throw NotFoundError when comment belongs to another thread', async () => {
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-456', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyAvailableComment('comment-123', 'thread-123'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError when user is not the comment owner', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-456'))
        .rejects
        .toThrow(AuthorizationError);
    });

    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-xxx', 'user-123'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should not throw AuthorizationError when user is the comment owner', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123'))
        .resolves
        .not.toThrow(AuthorizationError);
    });
  });

  describe('deleteCommentById function', () => {
    it('should soft delete the comment', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.deleteCommentById('comment-123');

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
      expect(comments[0].content).toEqual('sebuah comment');
    });

    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.deleteCommentById('comment-xxx'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return an empty array when the thread has no comment', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      expect(comments).toEqual([]);
    });

    it('should return the thread comments ordered ascending by date', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        threadId: 'thread-123',
        owner: 'user-456',
        content: 'comment kedua',
        date: '2021-08-08T07:26:21.338Z',
        isDelete: true,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'comment pertama',
        date: '2021-08-08T07:22:33.555Z',
        isDelete: false,
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      expect(comments).toStrictEqual([
        {
          id: 'comment-123',
          username: 'dicoding',
          date: '2021-08-08T07:22:33.555Z',
          content: 'comment pertama',
          isDelete: false,
        },
        {
          id: 'comment-456',
          username: 'johndoe',
          date: '2021-08-08T07:26:21.338Z',
          content: 'comment kedua',
          isDelete: true,
        },
      ]);
    });
  });
});
