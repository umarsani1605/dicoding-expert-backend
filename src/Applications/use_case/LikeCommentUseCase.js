import NewLike from '../../Domains/likes/entities/NewLike.js';

class LikeCommentUseCase {
  constructor({ likeRepository, commentRepository, threadRepository }) {
    this._likeRepository = likeRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);

    const { threadId, commentId, owner } = useCasePayload;
    const newLike = new NewLike({ commentId, owner });

    await this._threadRepository.verifyAvailableThread(threadId);
    await this._commentRepository.verifyAvailableComment(commentId, threadId);

    const liked = await this._likeRepository.isLiked(commentId, owner);

    if (liked) {
      await this._likeRepository.deleteLike(commentId, owner);
      return;
    }

    await this._likeRepository.addLike(newLike);
  }

  _verifyPayload({ threadId }) {
    if (!threadId) {
      throw new Error('LIKE_COMMENT_USE_CASE.NOT_CONTAIN_THREAD_ID');
    }

    if (typeof threadId !== 'string') {
      throw new Error('LIKE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default LikeCommentUseCase;
