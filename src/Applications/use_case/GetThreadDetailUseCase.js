import DetailThread from '../../Domains/threads/entities/DetailThread.js';
import DetailComment from '../../Domains/comments/entities/DetailComment.js';
import DetailReply from '../../Domains/replies/entities/DetailReply.js';

class GetThreadDetailUseCase {
  constructor({
    threadRepository, commentRepository, replyRepository, likeRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeRepository = likeRepository;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);

    const { threadId } = useCasePayload;

    const thread = await this._threadRepository.getThreadById(threadId);
    const rawComments = await this._commentRepository.getCommentsByThreadId(threadId);
    const rawReplies = await this._replyRepository.getRepliesByThreadId(threadId);
    const likeCounts = await this._likeRepository.getLikeCountsByThreadId(threadId);

    const comments = rawComments.map((comment) => new DetailComment({
      ...comment,
      replies: rawReplies
        .filter((reply) => reply.commentId === comment.id)
        .map((reply) => new DetailReply(reply)),
      likeCount: likeCounts
        .find((like) => like.commentId === comment.id)?.likeCount ?? 0,
    }));

    return new DetailThread({ ...thread, comments });
  }

  _verifyPayload({ threadId }) {
    if (!threadId) {
      throw new Error('GET_THREAD_DETAIL_USE_CASE.NOT_CONTAIN_THREAD_ID');
    }

    if (typeof threadId !== 'string') {
      throw new Error('GET_THREAD_DETAIL_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default GetThreadDetailUseCase;
