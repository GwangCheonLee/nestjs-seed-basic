import {IsIn, IsOptional, IsString} from 'class-validator';
import {PaginatedDto} from '../../common/dto/paginated.dto';

export class UserPaginatedDto extends PaginatedDto {
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsString()
  @IsIn(['email', 'nickname', 'createdAt', 'updatedAt'])
  sortBy: string = 'createdAt';
}
