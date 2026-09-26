import express from 'express';

const createCommentsRouter = (handler, authenticate, repliesRouter) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, handler.postCommentHandler);
  router.delete('/:commentId', authenticate, handler.deleteCommentHandler);
  router.use('/:commentId/replies', repliesRouter);

  return router;
};

export default createCommentsRouter;
