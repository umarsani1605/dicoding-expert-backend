import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';
import JwtTokenManager from '../JwtTokenManager.js';
import config from '../../../Commons/config.js';

describe('JwtTokenManager', () => {
  describe('createAccessToken function', () => {
    it('should create accessToken correctly', async () => {
      const payload = {
        username: 'dicoding',
      };
      const mockJwtToken = {
        sign: vi.fn().mockImplementation(() => 'mock_token'),
      };
      const jwtTokenManager = new JwtTokenManager(mockJwtToken);

      const accessToken = await jwtTokenManager.createAccessToken(payload);

      expect(mockJwtToken.sign).toBeCalledWith(payload, config.auth.accessTokenKey);
      expect(accessToken).toEqual('mock_token');
    });
  });

  describe('createRefreshToken function', () => {
    it('should create refreshToken correctly', async () => {
      const payload = {
        username: 'dicoding',
      };
      const mockJwtToken = {
        sign: vi.fn().mockImplementation(() => 'mock_token'),
      };
      const jwtTokenManager = new JwtTokenManager(mockJwtToken);

      const refreshToken = await jwtTokenManager.createRefreshToken(payload);

      expect(mockJwtToken.sign).toBeCalledWith(payload, config.auth.refreshTokenKey);
      expect(refreshToken).toEqual('mock_token');
    });
  });

  describe('verifyRefreshToken function', () => {
    it('should throw InvariantError when verification failed', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken({ username: 'dicoding' });

      await expect(jwtTokenManager.verifyRefreshToken(accessToken))
        .rejects
        .toThrow(InvariantError);
    });

    it('should not throw InvariantError when refresh token verified', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const refreshToken = await jwtTokenManager.createRefreshToken({ username: 'dicoding' });

      await expect(jwtTokenManager.verifyRefreshToken(refreshToken))
        .resolves
        .not.toThrow(InvariantError);
    });
  });

  describe('verifyAccessToken function', () => {
    it('should throw AuthenticationError when the token is not a valid access token', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const refreshToken = await jwtTokenManager.createRefreshToken({ username: 'dicoding' });

      await expect(jwtTokenManager.verifyAccessToken(refreshToken))
        .rejects
        .toThrow(AuthenticationError);
    });

    it('should return the access token payload when the token is valid', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken({ id: 'user-123', username: 'dicoding' });

      const payload = await jwtTokenManager.verifyAccessToken(accessToken);

      expect(payload.id).toEqual('user-123');
      expect(payload.username).toEqual('dicoding');
    });
  });

  describe('decodePayload function', () => {
    it('should decode payload correctly', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken({ username: 'dicoding' });

      const { username: expectedUsername } = await jwtTokenManager.decodePayload(accessToken);

      expect(expectedUsername).toEqual('dicoding');
    });
  });
});