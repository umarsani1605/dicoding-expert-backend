import LikeCommentUseCase from '../../../../Applications/use_case/LikeCommentUseCase.js';

class LikesHandler {
  constructor(container) {
    this._container = container;

    this.putLikeHandler = this.putLikeHandler.bind(this);
  }

  async putLikeHandler(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;
      const likeCommentUseCase = this._container.getInstance(LikeCommentUseCase.name);
      await likeCommentUseCase.execute({ threadId, commentId, owner });

      res.json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LikesHandler;
