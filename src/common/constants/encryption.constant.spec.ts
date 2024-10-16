import {compareWithHash, hashPlainText} from './encryption.constant';

describe('bcrypt functions', () => {
  const plainText = 'password';
  let hashedText: string;

  beforeAll(async () => {
    hashedText = await hashPlainText(plainText);
  });

  describe('hashPlainText', () => {
    it('should hash plain text', () => {
      expect(hashedText).not.toEqual(plainText);
      expect(hashedText).toHaveLength(60);
    });
  });

  describe('compareWithHash', () => {
    it('should return true for correct plain text', async () => {
      const result = await compareWithHash(plainText, hashedText);
      expect(result).toEqual(true);
    });

    it('should return false for incorrect plain text', async () => {
      const result = await compareWithHash('wrongpassword', hashedText);
      expect(result).toEqual(false);
    });
  });
});
