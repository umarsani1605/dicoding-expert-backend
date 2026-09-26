import LikesTableTestHelper from '../../../../tests/LikesTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import NewLike from '../../../Domains/likes/entities/NewLike.js';
import pool from '../../database/postgres/pool.js';
import LikeRepositoryPostgres from '../LikeRepositoryPostgres.js';

describe('LikeRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addLike function', () => {
    it('should persist the like', async () => {
      const newLike = new NewLike({ commentId: 'comment-123', owner: 'user-456' });
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      await likeRepositoryPostgres.addLike(newLike);

      const likes = await LikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-456');
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toEqual('like-123');
    });
  });

  describe('deleteLike function', () => {
    it('should remove the like from the database', async () => {
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: 'user-456' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      await likeRepositoryPostgres.deleteLike('comment-123', 'user-456');

      const likes = await LikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-456');
      expect(likes).toHaveLength(0);
    });
  });

  describe('isLiked function', () => {
    it('should return false when the user has not liked the comment', async () => {
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      const liked = await likeRepositoryPostgres.isLiked('comment-123', 'user-456');

      expect(liked).toEqual(false);
    });

    it('should return true when the user has liked the comment', async () => {
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: 'user-456' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      const liked = await likeRepositoryPostgres.isLiked('comment-123', 'user-456');

      expect(liked).toEqual(true);
    });
  });

  describe('getLikeCountsByThreadId function', () => {
    it('should return an empty array when no comment of the thread is liked', async () => {
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      expect(counts).toEqual([]);
    });

    it('should return the like count of every liked comment in the thread', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123', owner: 'user-456' });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: 'user-123' });
      await LikesTableTestHelper.addLike({ id: 'like-456', commentId: 'comment-123', owner: 'user-456' });
      await LikesTableTestHelper.addLike({ id: 'like-789', commentId: 'comment-456', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      expect(counts).toHaveLength(2);
      expect(counts).toContainEqual({ commentId: 'comment-123', likeCount: 2 });
      expect(counts).toContainEqual({ commentId: 'comment-456', likeCount: 1 });
    });

    it('should not count likes that belong to another thread', async () => {
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({ id: 'comment-789', threadId: 'thread-456', owner: 'user-456' });
      await LikesTableTestHelper.addLike({ id: 'like-789', commentId: 'comment-789', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      expect(counts).toEqual([]);
    });
  });
});
