import { vi } from 'vitest';
import AuthenticationError from '../../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';
import createAuthenticationMiddleware from '../authentication.js';

const createContainer = (tokenManager) => ({
  getInstance: vi.fn(() => tokenManager),
});

describe('authentication middleware', () => {
  it('should pass AuthenticationError to next when authorization header is missing', async () => {
    const tokenManager = new AuthenticationTokenManager();
    tokenManager.verifyAccessToken = vi.fn();
    const middleware = createAuthenticationMiddleware(createContainer(tokenManager));
    const req = { headers: {} };
    const next = vi.fn();

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect(tokenManager.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should pass AuthenticationError to next when the scheme is not Bearer', async () => {
    const tokenManager = new AuthenticationTokenManager();
    tokenManager.verifyAccessToken = vi.fn();
    const middleware = createAuthenticationMiddleware(createContainer(tokenManager));
    const req = { headers: { authorization: 'Basic some_token' } };
    const next = vi.fn();

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect(tokenManager.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should pass the error to next when the token is rejected', async () => {
    const tokenManager = new AuthenticationTokenManager();
    tokenManager.verifyAccessToken = vi.fn(() => Promise.reject(new AuthenticationError('akses token tidak valid')));
    const middleware = createAuthenticationMiddleware(createContainer(tokenManager));
    const req = { headers: { authorization: 'Bearer invalid_token' } };
    const next = vi.fn();

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    expect(tokenManager.verifyAccessToken).toHaveBeenCalledWith('invalid_token');
  });

  it('should put the credentials on the request when the token is valid', async () => {
    const tokenManager = new AuthenticationTokenManager();
    tokenManager.verifyAccessToken = vi.fn(() => Promise.resolve({ id: 'user-123', username: 'dicoding' }));
    const container = createContainer(tokenManager);
    const middleware = createAuthenticationMiddleware(container);
    const req = { headers: { authorization: 'Bearer valid_token' } };
    const next = vi.fn();

    await middleware(req, {}, next);

    expect(req.auth).toStrictEqual({ credentials: { id: 'user-123', username: 'dicoding' } });
    expect(next).toHaveBeenCalledWith();
    expect(container.getInstance).toHaveBeenCalledWith(AuthenticationTokenManager.name);
    expect(tokenManager.verifyAccessToken).toHaveBeenCalledWith('valid_token');
  });
});
