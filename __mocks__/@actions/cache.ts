export const restoreCache = jest.fn().mockResolvedValue('test');

export const saveCache = jest.fn().mockResolvedValue('test');

export const { ReserveCacheError } = jest.requireActual('@actions/cache');
