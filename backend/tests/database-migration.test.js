const DatabaseMigrator = require("../src/database/migrations");
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/database");

describe("Database Migration System", () => {
  let migrator;
  let testMigrationsPath;
  let testId;

  beforeAll(async () => {
    testId = Date.now().toString().slice(-8);

    migrator = new DatabaseMigrator();

    testMigrationsPath = path.join(__dirname, `../test-migrations-${testId}`);
    if (!fs.existsSync(testMigrationsPath)) {
      fs.mkdirSync(testMigrationsPath, { recursive: true });
    }

    migrator.migrationsPath = testMigrationsPath;
  });

  afterAll(async () => {
    if (fs.existsSync(testMigrationsPath)) {
      fs.rmSync(testMigrationsPath, { recursive: true, force: true });
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM schema_migrations WHERE version LIKE $1", [
        `20250819${testId.slice(-4)}%`,
      ]);
    } catch (error) {
      // Ignore if table doesn't exist
    } finally {
      client.release();
    }

    await pool.end();
  });

  beforeEach(async () => {
    if (fs.existsSync(testMigrationsPath)) {
      const files = fs.readdirSync(testMigrationsPath);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testMigrationsPath, file));
      });
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM schema_migrations WHERE version LIKE $1", [
        `20250819${testId.slice(-4)}%`,
      ]);
    } catch (error) {
      // Ignore if table doesn't exist
    } finally {
      client.release();
    }
  });

  test("initializes migration system and creates table", async () => {
    await migrator.initialize();

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'schema_migrations' AND table_schema = 'public'
      `);
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    } finally {
      client.release();
    }
  });

  test("calculates checksum correctly", () => {
    const content = "SELECT 1;";
    const checksum = migrator.calculateChecksum(content);

    expect(checksum).toBeTruthy();
    expect(typeof checksum).toBe("string");
    expect(checksum.length).toBe(64);

    const checksum2 = migrator.calculateChecksum(content);
    expect(checksum).toBe(checksum2);
  });

  test("detects available migrations", async () => {
    const testTime1 = `20250819${testId.slice(-4)}01`;
    const testTime2 = `20250819${testId.slice(-4)}02`;
    const migration1 = `${testTime1}_test_migration_1.sql`;
    const migration2 = `${testTime2}_test_migration_2.sql`;

    fs.writeFileSync(path.join(testMigrationsPath, migration1), "SELECT 1;");
    fs.writeFileSync(path.join(testMigrationsPath, migration2), "SELECT 2;");

    const migrations = await migrator.getAvailableMigrations();

    expect(migrations.length).toBe(2);
    expect(migrations[0].version).toBe(testTime1);
    expect(migrations[0].name).toBe("test_migration_1");
    expect(migrations[1].version).toBe(testTime2);
    expect(migrations[1].name).toBe("test_migration_2");
  });

  test("generates migration file correctly", async () => {
    const result = await migrator.generateMigration("test_feature");

    expect(result.version).toBeTruthy();
    expect(result.filename).toContain("test_feature");
    expect(result.filepath).toBeTruthy();

    expect(fs.existsSync(result.filepath)).toBe(true);

    const content = fs.readFileSync(result.filepath, "utf8");
    expect(content).toContain("Migration: test_feature");
    expect(content).toContain(`Version: ${result.version}`);
  });

  test("runs simple migration successfully", async () => {
    await migrator.initialize();

    const migrationContent = `
      -- Test migration
      CREATE TABLE IF NOT EXISTS test_migration_table_${testId} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );
    `;

    const testVersion = `20250819${testId.slice(-4)}03`;
    const migrationFile = path.join(testMigrationsPath, `${testVersion}_create_test_table.sql`);
    fs.writeFileSync(migrationFile, migrationContent);

    const migration = {
      version: testVersion,
      name: "create_test_table",
      filename: `${testVersion}_create_test_table.sql`,
      fullPath: migrationFile,
    };

    const result = await migrator.runMigration(migration);

    expect(result.success).toBe(true);
    expect(result.executionTime).toBeGreaterThan(0);

    const client = await pool.connect();
    try {
      const tableResult = await client.query(
        `
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = $1
      `,
        [`test_migration_table_${testId}`]
      );
      expect(tableResult.rows.length).toBe(1);

      await client.query(`DROP TABLE IF EXISTS test_migration_table_${testId}`);
    } finally {
      client.release();
    }
  });

  test("gets migration status correctly", async () => {
    await migrator.initialize();

    fs.writeFileSync(
      path.join(testMigrationsPath, `20250819${testId.slice(-4)}04_test_migration.sql`),
      "SELECT 1;"
    );

    const status = await migrator.getStatus();

    expect(status).toHaveProperty("currentVersion");
    expect(status).toHaveProperty("totalMigrations");
    expect(status).toHaveProperty("appliedMigrations");
    expect(status).toHaveProperty("pendingMigrations");
    expect(status).toHaveProperty("applied");
    expect(status).toHaveProperty("pending");

    expect(status.totalMigrations).toBe(1);
    expect(status.pendingMigrations).toBe(1);
    expect(status.pending.length).toBe(1);
  });

  test("validates migration file naming", async () => {
    fs.writeFileSync(path.join(testMigrationsPath, "invalid_name.sql"), "SELECT 1;");
    fs.writeFileSync(path.join(testMigrationsPath, "123_short_version.sql"), "SELECT 1;");
    const validVersion = `20250819${testId.slice(-4)}05`;
    fs.writeFileSync(
      path.join(testMigrationsPath, `${validVersion}_valid_migration.sql`),
      "SELECT 1;"
    );

    const migrations = await migrator.getAvailableMigrations();

    expect(migrations.length).toBe(1);
    expect(migrations[0].version).toBe(validVersion);
  });
});
