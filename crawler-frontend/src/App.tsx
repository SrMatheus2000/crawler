import { ScanResult, StartScanResponse, FormFeild } from './types';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import linearProgressClasses from '@mui/material/LinearProgress/linearProgressClasses';
import Paper from '@mui/material/Paper';
import styled from '@mui/material/styles/styled';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef } from '@mui/x-data-grid/';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

const BorderLinearProgress = styled(LinearProgress)(() => ({
  height: 10,
  borderRadius: 5,
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
  },
}));

const scanUrl = import.meta.env.VITE_SCAN_URL;

const fetchScanStatus = (scanId: string) => async () => {
  return axios.get<ScanResult>(`${scanUrl}/get-scan/${scanId}`);
};

function App() {
  const [url, setUrl] = useState('');
  const [maxUrls, setMaxUrls] = useState(0);
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);
  const [ignore, setIgnore] = useState<string[]>([]);

  const [scanning, setScanning] = useState(false);
  const [finished, setFinished] = useState(false);

  const [scanId, setScanId] = useState('');

  const [scanData, setScanData] = useState<ScanResult>();

  useQuery({
    queryKey: ['scanStatus', scanId],
    queryFn: fetchScanStatus(scanId),
    refetchInterval: 1000,
    enabled: !!scanId && !finished && scanning,
    onSuccess: ({ data }) => {
      setScanData(data);
      setFinished(data.percentage === 100);
      setScanning(data.percentage !== 100);
    },
  });

  const startScanning = async () => {
    setScanning(true);
    setFinished(false);

    const { data } = await axios.post<StartScanResponse>(
      `${scanUrl}/start-scan`,
      {
        url,
        maxUrls,
        additionalUrls,
        ignore,
      }
    );

    setScanId(data.scanId);
  };

  const stopScanning = async () => {
    setScanning(false);
    setFinished(true);
    await axios.delete<ScanResult>(`${scanUrl}/stop-scan/${scanId}`);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const formFields = useMemo<FormFeild[]>(() => {
    return scanData?.forms.reduce((acc, form) => {

      if (!form.fields) return acc;

      return [...acc, ...form.fields];

    }, [] as FormFeild[]) || [];
  }, [scanData?.forms]);

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Card>
        <CardHeader title="Trending Crawler" />
        <CardContent>
          <Typography><Box sx={{ fontWeight: 'bold', display: 'inline' }}>Discipline:</Box> Trending Information Technology</Typography>
          <Typography><Box sx={{ fontWeight: 'bold', display: 'inline' }}>Semester:</Box> 2022/2</Typography>
          <Typography><Box sx={{ fontWeight: 'bold', display: 'inline' }}>Course:</Box> Information Security</Typography>
          <Typography><Box sx={{ fontWeight: 'bold', display: 'inline' }}>Instituition:</Box> University of Vale do Rio dos Sinos</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>Developers:</Typography>
          <Typography sx={{ ml: 4 }}>Gustavo de Negri</Typography>
          <Typography sx={{ ml: 4 }}>Arthur Oliveira</Typography>
          <Typography sx={{ ml: 4 }}>Matheus Wandscheer</Typography>
        </CardContent>
      </Card>
      
      
      <Paper
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={9} md={10}>
            <TextField
              label="Website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              label="Max URL's"
              type="number"
              value={maxUrls}
              onChange={(e) => setMaxUrls(Math.max(Number(e.target.value), 0))}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={[]}
              value={additionalUrls}
              onChange={(e, value) => setAdditionalUrls(value as string[])}
              autoSelect
              freeSolo
              multiple
              renderInput={(params) => (
                <TextField {...params} label="Additional URL's" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={[]}
              value={ignore}
              onChange={(e, value) => setIgnore(value as string[])}
              autoSelect
              freeSolo
              multiple
              renderInput={(params) => (
                <TextField {...params} label="URL's to Ignore" />
              )}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} justifyContent="flex-end">
          <Grid item>
            {scanning ? (
              <Button sx={{ mt: 3, mb: 2 }} onClick={stopScanning} color='error'>
                Stop Scan
              </Button>
            ) : (
              <Button sx={{ mt: 3, mb: 2 }} onClick={startScanning}>
                Start Scan
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {!finished && scanning && (
        <Paper
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <BorderLinearProgress 
                variant={scanData?.percentage ? 'determinate' : 'indeterminate'} 
                value={scanData?.percentage}/>
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">{scanData?.percentage || 0}%</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="body2" color="text.secondary">Status: {scanData?.status || 'Starting'}</Typography>
            <Typography variant="body2" color="text.secondary">Estimated Remaining Time: {scanData?.remainingTime || 'N/A'}</Typography>
          </Box>
        </Paper>
      )}

      {!!scanData?.cookies && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>Cookies:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={cookiesColumn}
              rows={scanData.cookies}
              getRowId={row => row.name}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
      
      {!!scanData?.forms && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>Forms:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={formColumn}
              rows={formFields}
              getRowId={row => row._id}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
      
      {!!scanData?.localStorage && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>LocalStorage:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={storageColumn}
              rows={Object.entries(scanData.localStorage).map(([name, value]) => ({ name, value }))}
              getRowId={row => row.name}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
      
      {!!scanData?.sessionStorage && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>SessionStorage:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={storageColumn}
              rows={Object.entries(scanData.sessionStorage).map(([name, value]) => ({ name, value }))}
              getRowId={row => row.name}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
      
      {!!scanData?.imports && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>Imports:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={singleColumn}
              rows={scanData.imports.map((value) => ({ value }))}
              getRowId={row => row.value}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
      
      {!!scanData?.scripts && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>Scripts:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={singleColumn}
              rows={scanData.scripts.map((value) => ({ value }))}
              getRowId={row => row.value}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
      
      {!!scanData?.links && (
        <Box sx={{ marginTop: 4 }} >
          <Typography variant='h6' gutterBottom>Urls found:</Typography>
          <Paper>
            <DataGrid
              sx={{ width: '100%' }}
              columns={singleColumn}
              rows={scanData.links.map((value) => ({ value }))}
              getRowId={row => row.value}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </Paper>
        </Box>
      )}
    </Container>
  );
}

export default App;


const cookiesColumn: GridColDef[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'value', headerName: 'Value', width: 300, flex: 1 },
  { field: 'domain', headerName: 'Domain' },
  { field: 'path', headerName: 'Path' },
  { field: 'expires', headerName: 'Expires' },
  { field: 'httpOnly', headerName: 'httpOnly' },
  { field: 'secure', headerName: 'Secure' },
  { field: 'session', headerName: 'Session' },
];

const formColumn: GridColDef[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'value', headerName: 'Value', flex: 1 },
  { field: 'type', headerName: 'Type' },
  { field: 'required', headerName: 'Required' },
  { field: 'checked', headerName: 'Checked' },
];

const storageColumn: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'value', headerName: 'Value', flex: 1 },
];

const singleColumn: GridColDef[] = [
  { field: 'value', headerName: 'Value', flex: 1 }
];
