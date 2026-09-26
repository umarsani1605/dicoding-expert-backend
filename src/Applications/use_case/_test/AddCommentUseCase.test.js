import { vi } from 'vitest';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddCommentUseCase from '../AddCommentUseCase.js';

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    const useCasePayload = {
      content: 'sebuah comment',
      threadId: 'thread-123',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn(() => Promise.resolve());
    mockCommentRepository.addComment = vi.fn(() => Promise.resolve(new AddedComment({
      id: 'comment-123',
      content: 'sebuah comment',
      owner: 'user-123',
    })));

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    const addedComment = await addCommentUseCase.execute(useCasePayload);

    expect(addedComment).toStrictEqual(new AddedComment({
      id: 'comment-123',
      content: 'sebuah comment',
      owner: 'user-123',
    }));
    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.addComment).toHaveBeenCalledWith(new NewComment(useCasePayload));
  });
});
