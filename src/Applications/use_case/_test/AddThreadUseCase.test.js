import { vi } from 'vitest';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddThreadUseCase from '../AddThreadUseCase.js';

describe('AddThreadUseCase', () => {
  it('should orchestrate the add thread action correctly', async () => {
    const useCasePayload = {
      title: 'sebuah thread',
      body: 'sebuah body thread',
      owner: 'user-123',
    };

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = vi.fn(() => Promise.resolve(new AddedThread({
      id: 'thread-123',
      title: 'sebuah thread',
      owner: 'user-123',
    })));

    const addThreadUseCase = new AddThreadUseCase({ threadRepository: mockThreadRepository });

    const addedThread = await addThreadUseCase.execute(useCasePayload);

    expect(addedThread).toStrictEqual(new AddedThread({
      id: 'thread-123',
      title: 'sebuah thread',
      owner: 'user-123',
    }));
    expect(mockThreadRepository.addThread).toHaveBeenCalledWith(new NewThread(useCasePayload));
  });
});
