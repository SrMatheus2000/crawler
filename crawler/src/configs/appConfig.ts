import dotenv from 'dotenv';
import { Config } from 'tunnel-ssh';
import fs from 'fs';

dotenv.config({
  path: fs.existsSync('.env.local') ? '.env.local' : '.env'
});

export const port = Number(process.env.SERVER_PORT);
export const maxQueue = Number(process.env.MAX_QUEUE);
export const timeout = Number(process.env.TIMEOUT);

export const mongoUser = process.env.MONGO_USER;
export const mongoPassword = process.env.MONGO_PASSWORD;
export const mongoHost = process.env.MONGO_HOST;
export const mongoPort = Number(process.env.MONGO_PORT);

export const sshKeyFile = String(process.env.SSH_KEY_FILE);
export const sshHost = process.env.SSH_HOST;
export const sshUser = process.env.SSH_USER;
export const sshPort = Number(process.env.SSH_PORT);


export const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/trending?authSource=admin`;

export const sshConfig: Config = {
  username: sshUser,
  host: sshHost,
  privateKey: fs.readFileSync(sshKeyFile),
  port: sshPort,
  dstHost: mongoHost,
  dstPort: mongoPort
};