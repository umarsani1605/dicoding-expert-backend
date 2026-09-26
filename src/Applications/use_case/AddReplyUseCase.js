import NewReply from '../../Domains/replies/entities/NewReply.js';

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { content, threadId, commentId, owner } = useCasePayload;
    const newReply = new NewReply({ content, commentId, owner });

    await this._threadRepository.verifyAvailableThread(threadId);
    await this._commentRepository.verifyAvailableComment(newReply.commentId, threadId);

    return this._replyRepository.addReply(newReply);
  }
}

export default AddReplyUseCase;
