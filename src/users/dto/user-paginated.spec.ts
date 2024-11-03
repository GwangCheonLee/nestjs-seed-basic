import {validate} from 'class-validator';
import {UserPaginatedDto} from './user-paginated.dto';

describe('UserPaginatedDto', () => {
  let dto: UserPaginatedDto;

  beforeEach(() => {
    dto = new UserPaginatedDto();
  });

  describe('sort property', () => {
    it('should allow ASC value', async () => {
      dto.sort = 'ASC';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow DESC value', async () => {
      dto.sort = 'DESC';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should not allow invalid sort values', async () => {
      dto.sort = 'INVALID' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isIn).toBeDefined();
    });

    it('should use ASC as default value', () => {
      expect(dto.sort).toBe('ASC');
    });
  });

  describe('sortBy property', () => {
    it('should allow valid sortBy values', async () => {
      const validValues = ['email', 'nickname', 'createdAt', 'updatedAt'];

      for (const value of validValues) {
        dto.sortBy = value;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should not allow invalid sortBy values', async () => {
      dto.sortBy = 'invalidField';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isIn).toBeDefined();
    });

    it('should use createdAt as default value', () => {
      expect(dto.sortBy).toBe('createdAt');
    });
  });

  describe('inheritance', () => {
    it('should inherit pagination properties from PaginatedDto', () => {
      expect(dto).toHaveProperty('page');
      expect(dto).toHaveProperty('limit');
    });
  });

  describe('optional properties', () => {
    it('should validate when sort and sortBy are not provided', async () => {
      const dto = new UserPaginatedDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
