import 'dotenv/config';
import app from './app';
import connectDB from './config/database';
import runSeederMenu from './config/seeders';

const PORT = process.env.PORT || 3000;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  await runSeederMenu();
};

start();
