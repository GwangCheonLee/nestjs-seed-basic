import {IsNumber} from 'class-validator';
import {Type} from 'class-transformer';

export class PaginatedDto {
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  limit: number = 20;
}
