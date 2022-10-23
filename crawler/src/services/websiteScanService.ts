import { Scan } from '../db';
import Scanner from '../util/Scanner';

let runningScans: Record<string, Scanner> = {};

export const startScan = async ({ url = '', maxUrls = 0, additionalUrls = [], ignore = [] }) => {
  const scan = new Scan();
  scan.url = url;

  await scan.save();

  const scanner = new Scanner(scan.id, url, maxUrls, additionalUrls, ignore);

  runningScans[scan.id] = scanner;

  scanner.scanWebsite();

  return { scanId: scan.id };
};

export const cancelScan = (scanId: string) => {

  const results = runningScans[scanId]?.close();

  delete runningScans[scanId];

  return results;
};

export const getScan = async (scanId: string) => {
  return Scan.findById(scanId).exec();
};

export const getScanPercentage = async (scanId: string) => {
  return runningScans[scanId]?.makePercentage();
};
