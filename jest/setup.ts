import {DataSource} from 'typeorm';
import {DataType, newDb} from 'pg-mem';
import {v4} from 'uuid';

// eslint-disable-next-line require-jsdoc
export const setupDataSource = async () => {
  const database = newDb({
    autoCreateForeignKeyIndices: true,
  });

  database.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  database.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: v4,
      impure: true,
    });
  });

  database.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'pg-mem',
  });

  const dataSource: DataSource =
    await database.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    });
  await dataSource.initialize();
  await dataSource.synchronize();

  return dataSource;
};
