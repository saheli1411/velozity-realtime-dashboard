import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { initSocket } from './services/socket.service';
import { initBackgroundJobs } from './services/cron.service';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);
initBackgroundJobs();

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});