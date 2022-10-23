
import { startScan, cancelScan, getScan, getScanPercentage } from '../services/websiteScanService';
import { Router } from 'express';

const router = Router();

router.post('/api/start-scan', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const response = await startScan(req.body);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error scanning website');
  }
});

router.get('/api/get-scan/:id', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const response = await getScan(req.params.id);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting website');
  }
});

router.get('/api/get-scan/:id/percentage', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const response = await getScanPercentage(req.params.id);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting website');
  }
});

router.delete('/api/stop-scan/:id', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const response = cancelScan(req.params.id);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error stopping scan');
  }
});


export default router;