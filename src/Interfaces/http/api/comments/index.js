import CommentsHandler from './handler.js';
import createCommentsRouter from './routes.js';
import replies from '../replies/index.js';
import likes from '../likes/index.js';
import createAuthenticationMiddleware from '../../middlewares/authentication.js';

export default (container) => {
  const commentsHandler = new CommentsHandler(container);
  const authenticate = createAuthenticationMiddleware(container);

  return createCommentsRouter(
    commentsHandler,
    authenticate,
    replies(container),
    likes(container),
  );
};
