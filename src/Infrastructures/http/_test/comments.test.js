import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import ServerTestHelper from '../../../../tests/ServerTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';

describe('/threads/{threadId}/comments endpoint', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted comment', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });

      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment.id).toBeDefined();
      expect(response.body.data.addedComment.content).toEqual('sebuah comment');
      expect(response.body.data.addedComment.owner).toEqual(userId);

      const comments = await CommentsTableTestHelper.findCommentById(
        response.body.data.addedComment.id,
      );
      expect(comments).toHaveLength(1);
    });

    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .post('/threads/thread-xxx/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });

      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });

      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: ['sebuah comment'] });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena tipe data tidak sesuai');
    });

    it('should response 401 when request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .post('/threads/thread-123/comments')
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 and soft delete the comment', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userId });

      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });

    it('should response 403 when the user is not the comment owner', async () => {
      const app = await createServer(container);
      const { userId: ownerId } = await ServerTestHelper.registerAndLogin(app);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app, {
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: ownerId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: ownerId });

      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Anda tidak berhak mengakses resource ini');
    });

    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .delete('/threads/thread-xxx/comments/comment-123')
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
        .delete('/threads/thread-123/comments/comment-xxx')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 404 when comment belongs to another thread', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-456', owner: userId });

      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments[0].is_delete).toEqual(false);
    });

    it('should response 401 when request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete('/threads/thread-123/comments/comment-123');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });
});
