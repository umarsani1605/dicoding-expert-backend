import { vi } from 'vitest';
import NewLike from '../../../Domains/likes/entities/NewLike.js';
import LikeRepository from '../../../Domains/likes/LikeRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import LikeCommentUseCase from '../LikeCommentUseCase.js';

describe('LikeCommentUseCase', () => {
  const useCasePayload = {
    threadId: 'thread-123',
    commentId: 'comment-123',
    owner: 'user-123',
  };

  const buildDependencies = (isLiked) => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    mockThreadRepository.verifyAvailableThread = vi.fn(() => Promise.resolve());
    mockCommentRepository.verifyAvailableComment = vi.fn(() => Promise.resolve());
    mockLikeRepository.isLiked = vi.fn(() => Promise.resolve(isLiked));
    mockLikeRepository.addLike = vi.fn(() => Promise.resolve());
    mockLikeRepository.deleteLike = vi.fn(() => Promise.resolve());

    return { mockThreadRepository, mockCommentRepository, mockLikeRepository };
  };

  it('should throw error when payload did not contain needed property', async () => {
    const likeCommentUseCase = new LikeCommentUseCase({});

    await expect(likeCommentUseCase.execute({ commentId: 'comment-123', owner: 'user-123' }))
      .rejects
      .toThrow('LIKE_COMMENT_USE_CASE.NOT_CONTAIN_THREAD_ID');
  });

  it('should throw error when thread id is not string', async () => {
    const likeCommentUseCase = new LikeCommentUseCase({});

    await expect(likeCommentUseCase.execute({ threadId: 123, commentId: 'comment-123', owner: 'user-123' }))
      .rejects
      .toThrow('LIKE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should add a like when the user has not liked the comment', async () => {
    const {
      mockThreadRepository, mockCommentRepository, mockLikeRepository,
    } = buildDependencies(false);

    const likeCommentUseCase = new LikeCommentUseCase({
      likeRepository: mockLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await likeCommentUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toHaveBeenCalledWith('comment-123', 'thread-123');
    expect(mockLikeRepository.isLiked).toHaveBeenCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).toHaveBeenCalledWith(new NewLike({
      commentId: 'comment-123',
      owner: 'user-123',
    }));
    expect(mockLikeRepository.deleteLike).not.toHaveBeenCalled();
  });

  it('should remove the like when the user has already liked the comment', async () => {
    const {
      mockThreadRepository, mockCommentRepository, mockLikeRepository,
    } = buildDependencies(true);

    const likeCommentUseCase = new LikeCommentUseCase({
      likeRepository: mockLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await likeCommentUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith('thread-123');
    expect(mockCommentRepository.verifyAvailableComment).toHaveBeenCalledWith('comment-123', 'thread-123');
    expect(mockLikeRepository.isLiked).toHaveBeenCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.deleteLike).toHaveBeenCalledWith('comment-123', 'user-123');
    expect(mockLikeRepository.addLike).not.toHaveBeenCalled();
  });
});
