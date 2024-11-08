import * as fs from 'fs';
import * as path from 'path';
import {getPackageJsonField} from './package-info.util';

jest.mock('fs');

describe('getPackageJsonField', () => {
  const mockPackageJson = {
    name: 'test-package',
    version: '1.0.0',
    description: 'A test package for unit testing',
  };

  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
      if (filePath === path.resolve(process.cwd(), 'package.json')) {
        return JSON.stringify(mockPackageJson);
      }
      return '';
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the correct field value for "name"', () => {
    const result = getPackageJsonField('name');
    expect(result).toBe('test-package');
  });

  it('should return the correct field value for "version"', () => {
    const result = getPackageJsonField('version');
    expect(result).toBe('1.0.0');
  });

  it('should return the correct field value for "description"', () => {
    const result = getPackageJsonField('description');
    expect(result).toBe('A test package for unit testing');
  });

  it('should return undefined for a non-existent field', () => {
    const result = getPackageJsonField('nonExistentField');
    expect(result).toBeUndefined();
  });
});
