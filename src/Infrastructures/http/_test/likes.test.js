import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import ServerTestHelper from '../../../../tests/ServerTestHelper.js';
import LikesTableTestHelper from '../../../../tests/LikesTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';

describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and persist the like when the user has not liked the comment', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userId });

      const response = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const likes = await LikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', userId);
      expect(likes).toHaveLength(1);
    });

    it('should response 200 and remove the like when the user has already liked the comment', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userId });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: userId });

      const response = await request(app)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const likes = await LikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', userId);
      expect(likes).toHaveLength(0);
    });

    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .put('/threads/thread-xxx/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });

      const response = await request(app)
        .put('/threads/thread-123/comments/comment-xxx/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 401 when request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/threads/thread-123/comments/comment-123/likes');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when GET /threads/{threadId} after some likes', () => {
    it('should show the like count of every comment', async () => {
      const app = await createServer(container);
      const { userId: dicodingId } = await ServerTestHelper.registerAndLogin(app);
      const { userId: johndoeId } = await ServerTestHelper.registerAndLogin(app, {
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });

      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: dicodingId });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123', threadId: 'thread-123', owner: dicodingId, date: '2021-08-08T07:22:33.555Z',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-123', owner: johndoeId, date: '2021-08-08T07:26:21.338Z',
      });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: dicodingId });
      await LikesTableTestHelper.addLike({ id: 'like-456', commentId: 'comment-123', owner: johndoeId });
      await LikesTableTestHelper.addLike({ id: 'like-789', commentId: 'comment-456', owner: dicodingId });

      const response = await request(app).get('/threads/thread-123');

      expect(response.status).toEqual(200);
      const { comments } = response.body.data.thread;
      expect(comments[0].likeCount).toEqual(2);
      expect(comments[1].likeCount).toEqual(1);
    });

    it('should show zero like count when nobody liked the comment', async () => {
      const app = await createServer(container);
      const { userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userId });

      const response = await request(app).get('/threads/thread-123');

      expect(response.status).toEqual(200);
      expect(response.body.data.thread.comments[0].likeCount).toEqual(0);
    });
  });
});
