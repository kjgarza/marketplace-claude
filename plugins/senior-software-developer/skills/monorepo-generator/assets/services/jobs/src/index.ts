import { CronJob } from 'cron';

// Run every hour
const hourlyJob = new CronJob('0 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running hourly job...`);
  try {
    // Your hourly job logic here
    console.log('Hourly job completed');
  } catch (error) {
    console.error('Hourly job failed:', error);
  }
});

// Run daily at midnight UTC
const dailyJob = new CronJob('0 0 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running daily cleanup...`);
  try {
    // Your daily cleanup logic here
    console.log('Daily cleanup completed');
  } catch (error) {
    console.error('Daily cleanup failed:', error);
  }
});

// Start all jobs
hourlyJob.start();
dailyJob.start();

console.log('Job scheduler started');
console.log('Scheduled jobs:');
console.log('  - Hourly job: every hour at :00');
console.log('  - Daily job: every day at 00:00 UTC');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping jobs...');
  hourlyJob.stop();
  dailyJob.stop();
  process.exit(0);
});
