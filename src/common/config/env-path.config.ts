/**
 * Function to determine the environment file path based on NODE_ENV
 * @return {string} - Corresponding environment file path or default if not matched
 */
export const getEnvPath = (): string => {
  const envMap = {
    docker: 'env/.env.docker',
    local: 'env/.env.local',
    dev: 'env/.env.dev',
    prod: 'env/.env.prod',
    default: '.env',
  };

  return envMap[process.env.NODE_ENV] || envMap.default;
};
