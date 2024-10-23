import {Inject, Injectable} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisRepository {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  /**
   * Redis에 데이터를 저장합니다.
   *
   * @param {string} key - Redis에 저장할 데이터의 키
   * @param {any} value - 저장할 데이터 값
   * @param {number} [ttl] - 데이터의 TTL(초 단위, 선택사항)
   * @return {Promise<void>} - 데이터 저장이 완료되면 반환되는 Promise
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, stringValue, 'EX', ttl);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  /**
   * Redis에서 데이터를 가져옵니다.
   *
   * @template T - 반환할 데이터의 타입
   * @param {string} key - 가져올 데이터의 키
   * @return {Promise<T | null>} - 데이터를 성공적으로 가져오면 데이터를 반환, 없으면 null 반환
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value);
  }

  /**
   * Redis에서 데이터를 삭제합니다.
   *
   * @param {string} key - 삭제할 데이터의 키
   * @return {Promise<void>} - 데이터 삭제가 완료되면 반환되는 Promise
   */
  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Redis에 데이터가 존재하는지 확인합니다.
   *
   * @param {string} key - 존재 여부를 확인할 데이터의 키
   * @return {Promise<boolean>} - 데이터가 존재하면 true, 없으면 false 반환
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  /**
   * Redis에 해시 형태로 데이터를 저장합니다.
   *
   * @param {string} key - Redis 해시의 키
   * @param {string} field - 해시 안에 저장할 필드명
   * @param {any} value - 저장할 데이터 값
   * @return {Promise<void>} - 저장 완료 시 반환되는 Promise
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value);
    await this.redisClient.hset(key, field, stringValue);
  }

  /**
   * Redis 해시에서 데이터를 가져옵니다.
   *
   * @param {string} key - Redis 해시의 키
   * @param {string} field - 가져올 데이터의 필드명
   * @return {Promise<any | null>} - 데이터를 성공적으로 가져오면 반환, 없으면 null 반환
   */
  async hget(key: string, field: string): Promise<any | null> {
    const value = await this.redisClient.hget(key, field);
    if (!value) {
      return null;
    }
    return JSON.parse(value);
  }

  /**
   * Redis 해시에서 특정 필드를 삭제합니다.
   *
   * @param {string} key - Redis 해시의 키
   * @param {string} field - 삭제할 필드명
   * @return {Promise<void>} - 삭제 완료 시 반환되는 Promise
   */
  async hdel(key: string, field: string): Promise<void> {
    await this.redisClient.hdel(key, field);
  }
}
