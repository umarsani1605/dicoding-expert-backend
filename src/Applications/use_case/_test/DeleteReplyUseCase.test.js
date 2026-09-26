import { vi } from 'vitest';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import DeleteReplyUseCase from '../DeleteReplyUseCase.js';

describe('DeleteReplyUseCase', () => {
  it('should throw error when payload did not contain needed property', async () => {
    const deleteReplyUseCase = new DeleteReplyUseCase({});

    await expect(deleteReplyUseCase.execute({ threadId: 'thread-123', commentId: 'comment-123' }))
      .rejects
      .toThrow('DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', async () => {
    const deleteReplyUseCase = new DeleteReplyUseCase({});

    await expect(deleteReplyUseCase.execute({
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 123,
      owner: 'user-123',
    }))
      .rejects
      .toThrow('DELETE_REPLY_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the delete reply action correctly', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn(() => Promise.resolve());
    mockReplyRepository.verifyAvailableReply = vi.fn(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = vi.fn(() => Promise.resolve());
    mockReplyRepository.deleteReplyById = vi.fn(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await deleteReplyUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toHaveBeenCalledWith('comment-123', 'thread-123');
    expect(mockReplyRepository.verifyAvailableReply).toHaveBeenCalledWith('reply-123', 'comment-123');
    expect(mockReplyRepository.verifyReplyOwner).toHaveBeenCalledWith('reply-123', 'user-123');
    expect(mockReplyRepository.deleteReplyById).toHaveBeenCalledWith('reply-123');
  });
});
