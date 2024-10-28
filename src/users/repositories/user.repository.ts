import {DataSource, Repository, UpdateResult} from 'typeorm';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {User} from '../entities/user.entity';
import {compareWithHash} from '../../common/constants/encryption.constant';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  /**
   * 새로운 사용자를 등록합니다.
   *
   * @param {string} email - 사용자의 이메일
   * @param {string} hashedPassword - 암호화된 비밀번호
   * @param {string} nickname - 사용자의 닉네임
   * @return {Promise<User>} - 생성된 사용자 엔터티
   */
  signUp(
    email: string,
    hashedPassword: string,
    nickname: string,
  ): Promise<User> {
    return this.save({
      email: email,
      password: hashedPassword,
      nickname: nickname,
    });
  }

  /**
   * 이메일이 이미 등록되었는지 확인합니다.
   *
   * @param {string} email - 확인할 이메일
   * @return {Promise<boolean>} - 이메일이 등록된 경우 true, 그렇지 않으면 false
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    const userQuery = this.createQueryBuilder('user').where(
      'user.email = :email',
      {email},
    );
    const existingUser = await userQuery.getOne();

    return !!existingUser;
  }

  /**
   * 주어진 이메일로 사용자를 찾습니다.
   *
   * @param {string} email - 찾을 사용자의 이메일
   * @throws {NotFoundException} - 사용자를 찾을 수 없는 경우 예외 발생
   * @return {Promise<User>} - 조회된 사용자 반환
   */
  async findUserByEmail(email: string): Promise<User> {
    const user = await this.createQueryBuilder('user')
      .where('user.email = :email', {email})
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    return user;
  }

  /**
   * 사용자 자격 증명을 확인합니다.
   *
   * @param {string} email - 사용자의 이메일
   * @param {string} plainPassword - 입력된 비밀번호 (암호화되지 않음)
   * @return {Promise<User>} - 자격 증명이 유효한 경우 사용자 엔터티 반환
   * @throws {UnauthorizedException} - 자격 증명이 유효하지 않을 경우 예외 발생
   */
  async verifyUserCredentials(
    email: string,
    plainPassword: string,
  ): Promise<User> {
    const queryBuilder = this.createQueryBuilder('user').where(
      'user.email = :email',
      {email},
    );

    const user = await queryBuilder.getOne();

    const isPasswordValid =
      user && (await compareWithHash(plainPassword, user.password));

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials provided.');
    }

    return user;
  }

  /**
   * 주어진 ID로 사용자를 찾습니다.
   *
   * @param {number} userId - 찾을 사용자의 ID
   * @return {Promise<User>} - 사용자를 찾으면 반환
   * @throws {NotFoundException} - 사용자를 찾을 수 없는 경우 예외 발생
   */
  async findUserById(userId: number): Promise<User> {
    const queryBuilder = this.createQueryBuilder('user').where(
      'user.id = :userId',
      {userId},
    );

    const user = await queryBuilder.getOne();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  /**
   * 사용자의 2단계 인증 비밀키를 설정합니다.
   * @param {string} secret - 2단계 인증 비밀키
   * @param {number} userId - 사용자 ID
   * @return {Promise<UpdateResult>} - 업데이트 결과
   */
  setTwoFactorAuthenticationSecret(
    secret: string,
    userId: number,
  ): Promise<UpdateResult> {
    return this.update(userId, {
      twoFactorAuthenticationSecret: secret,
    });
  }
}
