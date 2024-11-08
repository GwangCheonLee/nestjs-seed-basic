import {validate} from 'class-validator';
import {plainToClass} from 'class-transformer';
import {PaginatedDto} from './paginated.dto';

describe('PaginatedDto', () => {
  it('should pass validation when page and limit are valid numbers', async () => {
    const dto = plainToClass(PaginatedDto, {page: 2, limit: 10});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should set default values when page and limit are not provided', async () => {
    const dto = plainToClass(PaginatedDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('should fail validation when page is not a number', async () => {
    const dto = plainToClass(PaginatedDto, {page: 'not-a-number', limit: 10});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should fail validation when limit is not a number', async () => {
    const dto = plainToClass(PaginatedDto, {page: 1, limit: 'not-a-number'});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });
});
