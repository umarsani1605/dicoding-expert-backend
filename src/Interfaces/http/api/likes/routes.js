import express from 'express';

const createLikesRouter = (handler, authenticate) => {
  const router = express.Router({ mergeParams: true });

  router.put('/', authenticate, handler.putLikeHandler);

  return router;
};

export default createLikesRouter;
