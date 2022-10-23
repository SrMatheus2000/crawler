import { port } from './configs/appConfig';
import WebsiteScanRoute from './routes/websiteScanRoute';
import express, { json, Express } from 'express';

const app: Express = express();

app.use(json());

app.use('/', WebsiteScanRoute);

app.use((req, res) => {
  res.status(404).send({ url: req.originalUrl + ' not found' });
});

app.listen(port, () => {
  console.log(`Running - Crawler.. ( port: ${port} )`);
});