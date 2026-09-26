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

describe('/threads endpoint', () => {
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

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      const app = await createServer(container);
      const { accessToken, userId } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread.id).toBeDefined();
      expect(response.body.data.addedThread.title).toEqual('sebuah thread');
      expect(response.body.data.addedThread.owner).toEqual(userId);

      const threads = await ThreadsTableTestHelper.findThreadById(
        response.body.data.addedThread.id,
      );
      expect(threads).toHaveLength(1);
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const app = await createServer(container);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      const app = await createServer(container);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });

    it('should response 400 when title more than 150 character', async () => {
      const app = await createServer(container);
      const { accessToken } = await ServerTestHelper.registerAndLogin(app);

      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'a'.repeat(151), body: 'sebuah body thread' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena karakter title melebihi batas limit');
    });

    it('should response 401 when request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .post('/threads')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });

    it('should response 401 when access token is invalid', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .post('/threads')
        .set('Authorization', 'Bearer invalid_token')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toBeDefined();
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 404 when thread not found', async () => {
      const app = await createServer(container);

      const response = await request(app).get('/threads/thread-xxx');

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 200 and thread detail with its comments and replies', async () => {
      const app = await createServer(container);
      const { userId: dicodingId } = await ServerTestHelper.registerAndLogin(app);
      const { userId: johndoeId } = await ServerTestHelper.registerAndLogin(app, {
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });

      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        owner: dicodingId,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: johndoeId,
        content: 'sebuah comment',
        date: '2021-08-08T07:22:33.555Z',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        threadId: 'thread-123',
        owner: dicodingId,
        content: 'comment yang dihapus',
        date: '2021-08-08T07:26:21.338Z',
        isDelete: true,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        owner: johndoeId,
        content: 'balasan yang dihapus',
        date: '2021-08-08T07:59:48.766Z',
        isDelete: true,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        commentId: 'comment-123',
        owner: dicodingId,
        content: 'sebuah balasan',
        date: '2021-08-08T08:07:01.522Z',
      });

      const response = await request(app).get('/threads/thread-123');

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const { thread } = response.body.data;
      expect(thread.id).toEqual('thread-123');
      expect(thread.title).toEqual('sebuah thread');
      expect(thread.body).toEqual('sebuah body thread');
      expect(thread.date).toEqual('2021-08-08T07:19:09.775Z');
      expect(thread.username).toEqual('dicoding');
      expect(thread.comments).toHaveLength(2);

      expect(thread.comments[0].id).toEqual('comment-123');
      expect(thread.comments[0].username).toEqual('johndoe');
      expect(thread.comments[0].content).toEqual('sebuah comment');
      expect(thread.comments[0].replies).toHaveLength(2);
      expect(thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
      expect(thread.comments[0].replies[1].content).toEqual('sebuah balasan');
      expect(thread.comments[0].replies[1].username).toEqual('dicoding');

      expect(thread.comments[1].id).toEqual('comment-456');
      expect(thread.comments[1].content).toEqual('**komentar telah dihapus**');
      expect(thread.comments[1].replies).toHaveLength(0);
    });
  });
});
