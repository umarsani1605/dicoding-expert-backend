import express from 'express';

const createThreadsRouter = (handler, authenticate, commentsRouter) => {
  const router = express.Router();

  router.post('/', authenticate, handler.postThreadHandler);
  router.get('/:threadId', handler.getThreadDetailHandler);
  router.use('/:threadId/comments', commentsRouter);

  return router;
};

export default createThreadsRouter;
