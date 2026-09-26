import { vi } from 'vitest';
import DetailThread from '../../../Domains/threads/entities/DetailThread.js';
import DetailComment from '../../../Domains/comments/entities/DetailComment.js';
import DetailReply from '../../../Domains/replies/entities/DetailReply.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should throw error when payload did not contain thread id', async () => {
    const getThreadDetailUseCase = new GetThreadDetailUseCase({});

    await expect(getThreadDetailUseCase.execute({}))
      .rejects
      .toThrow('GET_THREAD_DETAIL_USE_CASE.NOT_CONTAIN_THREAD_ID');
  });

  it('should throw error when thread id is not string', async () => {
    const getThreadDetailUseCase = new GetThreadDetailUseCase({});

    await expect(getThreadDetailUseCase.execute({ threadId: 123 }))
      .rejects
      .toThrow('GET_THREAD_DETAIL_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the get thread detail action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = vi.fn(() => Promise.resolve({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    }));

    mockCommentRepository.getCommentsByThreadId = vi.fn(() => Promise.resolve([
      {
        id: 'comment-123',
        username: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'sebuah comment',
        isDelete: false,
      },
      {
        id: 'comment-456',
        username: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: 'comment yang dihapus',
        isDelete: true,
      },
    ]));

    mockReplyRepository.getRepliesByThreadId = vi.fn(() => Promise.resolve([
      {
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'balasan yang dihapus',
        date: '2021-08-08T07:59:48.766Z',
        username: 'johndoe',
        isDelete: true,
      },
      {
        id: 'reply-456',
        commentId: 'comment-123',
        content: 'sebuah balasan',
        date: '2021-08-08T08:07:01.522Z',
        username: 'dicoding',
        isDelete: false,
      },
      {
        id: 'reply-789',
        commentId: 'comment-456',
        content: 'balasan pada comment lain',
        date: '2021-08-08T08:09:11.100Z',
        username: 'johndoe',
        isDelete: false,
      },
    ]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const detailThread = await getThreadDetailUseCase.execute({ threadId: 'thread-123' });

    expect(detailThread).toStrictEqual(new DetailThread({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        new DetailComment({
          id: 'comment-123',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
          isDelete: false,
          replies: [
            new DetailReply({
              id: 'reply-123',
              content: 'balasan yang dihapus',
              date: '2021-08-08T07:59:48.766Z',
              username: 'johndoe',
              isDelete: true,
            }),
            new DetailReply({
              id: 'reply-456',
              content: 'sebuah balasan',
              date: '2021-08-08T08:07:01.522Z',
              username: 'dicoding',
              isDelete: false,
            }),
          ],
        }),
        new DetailComment({
          id: 'comment-456',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          content: 'comment yang dihapus',
          isDelete: true,
          replies: [
            new DetailReply({
              id: 'reply-789',
              content: 'balasan pada comment lain',
              date: '2021-08-08T08:09:11.100Z',
              username: 'johndoe',
              isDelete: false,
            }),
          ],
        }),
      ],
    }));

    expect(detailThread.comments[0].content).toEqual('sebuah comment');
    expect(detailThread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
    expect(detailThread.comments[1].content).toEqual('**komentar telah dihapus**');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.getCommentsByThreadId).toHaveBeenCalledWith('thread-123');
    expect(mockReplyRepository.getRepliesByThreadId).toHaveBeenCalledWith('thread-123');
  });
});
