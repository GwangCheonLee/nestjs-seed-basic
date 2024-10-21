import * as fs from 'fs';
import * as path from 'path';

/**
 * package.json에서 특정 필드를 가져오는 함수.
 *
 * @param {string} fieldName - package.json에서 가져오려는 필드명
 * @return {string} - 필드값
 */
export function getPackageJsonField(fieldName: string): string {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson[fieldName];
}
