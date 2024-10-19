import {DataSource, Repository} from 'typeorm';
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

  async signUp(
    email: string,
    hashedPassword: string,
    nickname: string,
  ): Promise<User> {
    return await this.save({
      email: email,
      password: hashedPassword,
      nickname: nickname,
    });
  }

  async isEmailRegistered(email: string): Promise<boolean> {
    const userQuery = this.createQueryBuilder('user').where(
      'user.email = :email',
      {email},
    );
    const existingUser = await userQuery.getOne();

    return !!existingUser;
  }

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
}
