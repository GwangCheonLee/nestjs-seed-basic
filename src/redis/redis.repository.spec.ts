import {Test, TestingModule} from '@nestjs/testing';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import {RedisRepository} from './redis.repository';

describe('RedisRepository', () => {
  let redisRepository: RedisRepository;
  let redisClient: Redis;

  beforeAll(async () => {
    redisClient = new RedisMock() as unknown as Redis;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisRepository,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    redisRepository = module.get<RedisRepository>(RedisRepository);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  afterEach(async () => {
    await redisClient.flushall();
  });

  it('should set and get a value in Redis', async () => {
    const key = 'testKey';
    const value = {data: 'testData'};

    await redisRepository.set(key, value);
    const result = await redisRepository.get<typeof value>(key);

    expect(result).toEqual(value);
  });

  it('should set a value with TTL in Redis', async () => {
    const key = 'testKeyWithTTL';
    const value = {data: 'testData'};
    const ttl = 60;

    await redisRepository.set(key, value, ttl);
    const result = await redisRepository.get<typeof value>(key);

    expect(result).toEqual(value);

    const ttlResult = await redisClient.ttl(key);
    expect(ttlResult).toBeGreaterThan(0);
  });

  it('should delete a value from Redis', async () => {
    const key = 'deleteKey';
    const value = {data: 'toDelete'};

    await redisRepository.set(key, value);
    await redisRepository.delete(key);
    const result = await redisRepository.get<typeof value>(key);

    expect(result).toBeNull();
  });

  it('should check if a key exists in Redis', async () => {
    const key = 'existsKey';
    const value = {data: 'exists'};

    await redisRepository.set(key, value);
    const exists = await redisRepository.exists(key);

    expect(exists).toBe(true);
  });

  it('should return false when key does not exist in Redis', async () => {
    const exists = await redisRepository.exists('nonExistentKey');

    expect(exists).toBe(false);
  });

  it('should set and get a hash value in Redis', async () => {
    const key = 'hashKey';
    const field = 'field1';
    const value = {data: 'hashValue'};

    await redisRepository.hset(key, field, value);
    const result = await redisRepository.hget(key, field);

    expect(result).toEqual(value);
  });

  it('should return null when hget is called on non-existing key or field', async () => {
    const result = await redisRepository.hget(
      'nonExistingKey',
      'nonExistingField',
    );
    expect(result).toBeNull();
  });

  it('should delete a field from a hash in Redis', async () => {
    const key = 'hashKey';
    const field = 'fieldToDelete';
    const value = {data: 'toDelete'};

    await redisRepository.hset(key, field, value);
    await redisRepository.hdel(key, field);
    const result = await redisRepository.hget(key, field);

    expect(result).toBeNull();
  });
});
