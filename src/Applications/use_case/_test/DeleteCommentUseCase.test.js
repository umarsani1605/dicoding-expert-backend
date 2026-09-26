import { vi } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import DeleteCommentUseCase from '../DeleteCommentUseCase.js';

describe('DeleteCommentUseCase', () => {
  it('should throw error when payload did not contain needed property', async () => {
    const deleteCommentUseCase = new DeleteCommentUseCase({});

    await expect(deleteCommentUseCase.execute({ threadId: 'thread-123' }))
      .rejects
      .toThrow('DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', async () => {
    const deleteCommentUseCase = new DeleteCommentUseCase({});

    await expect(deleteCommentUseCase.execute({ threadId: 'thread-123', commentId: 123, owner: 'user-123' }))
      .rejects
      .toThrow('DELETE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the delete comment action correctly', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = vi.fn(() => Promise.resolve());
    mockCommentRepository.deleteCommentById = vi.fn(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await deleteCommentUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toHaveBeenCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.verifyCommentOwner).toHaveBeenCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.deleteCommentById).toHaveBeenCalledWith('comment-123');
  });
});
