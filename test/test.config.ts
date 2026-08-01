import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

export default () => {
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer('postgres:18.4').start();
    process.env.DB_HOST = postgresContainer.getHost();
    process.env.DB_PORT = postgresContainer.getPort().toString();
    process.env.DB_USERNAME = postgresContainer.getUsername();
    process.env.DB_PASSWORD = postgresContainer.getPassword();
    process.env.DB_DATABASE = postgresContainer.getDatabase();
  }, 60000);

  afterAll(async () => {
    if (postgresContainer) {
      await postgresContainer.stop();
    }
  });
};
