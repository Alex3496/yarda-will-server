import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/database';
import runSeederMenu from './config/seeders';

const run = async (): Promise<void> => {
  await connectDB();
  await runSeederMenu();
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Error en el proceso de seeders:', err);
  process.exit(1);
});
