import { initDatabase } from './db';
import { seedData } from './seed';

const main = async () => {
  try {
    console.log('Initializing database tables...');
    await initDatabase();
    console.log('Seeding initial data...');
    await seedData();
    console.log('Database initialization and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database setup failed:', err);
    process.exit(1);
  }
};

main();
