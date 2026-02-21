'use client';
import * as React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { DeleteOutline, FileUploadOutlined } from '@mui/icons-material';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useAuth } from '@/firebase/auth/auth_context';
import { useState } from 'react';
import GetUserRole from '@/firebase/util/GetUserRole';
import 'firebase/firestore';
import firebase from '@/firebase/firebase_config';
import { read, utils, writeFile, readFile } from 'xlsx';
import FacultyStats from '@/component/Dashboard/Users/FacultyStats';
import HeaderCard from '@/component/HeaderCard/HeaderCard';

export default function User() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [open, setOpen] = React.useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleClear();
  };

  const readExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // https://docs.sheetjs.com/docs/demos/local/file/
    setProcessing(true);
    const toastId = toast.loading(
      'Processing course data. This may take a couple minutes.',
      { duration: 300000000 }
    );

    try {
      const val = e.target.files?.[0];
      if (!val) return;
      console.log(val);
      const ab = await val.arrayBuffer();
      let data: Record<string, unknown>[] = [];
      var file = read(ab);

      const sheets = file.SheetNames;
      console.log(sheets);

      for (let i = 0; i < sheets.length; i++) {
        const temp = utils.sheet_to_json<Record<string, unknown>>(file.Sheets[file.SheetNames[i]]);
        console.log(temp);

        temp.forEach((res) => {
          data.push(res);
        });
      }
      console.log(data);
      console.log(data.length);

      for (let i = 0; i < data.length; i++) {
        const instructor = data[i]['__EMPTY_1'] as string | undefined;
        const researchLevel = data[i]['__EMPTY_28'] as string | undefined;
        if (instructor == undefined) {
          continue;
        }
        await firebase
          .firestore()
          .collection('faculty')
          .doc(instructor)
          .set({
            instructor,
            research_level: researchLevel ?? 'None',
          });
      }
      setProcessing(false);
      toast.dismiss(toastId);
      toast.success('Data upload complete!', { duration: 2000 });
    } catch (err) {
      console.log(err);
      toast.dismiss(toastId);
      toast.error('Data upload failed.', { duration: 2000 });
    }
  };
  const handleClear = async () => {
    setProcessing(true);
    const toastId = toast.loading(
      'Clearing semester data. This may take a couple minutes.',
      { duration: 30000000 }
    );

    const querySnapshot = await firebase
      .firestore()
      .collection('faculty')
      .get();
    querySnapshot.forEach((doc) => doc.ref.delete());

    setProcessing(false);
    toast.success('Semester data cleared!');
    toast.dismiss(toastId);
  };

  if (role !== 'admin') return <div> Forbidden </div>;
  return (
    <>
      <HeaderCard text="Faculty Statistics" />
      <Toaster />
      <Box
        sx={{
          marginTop: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box sx={{ mb: 2, width: '100%' }}>
          <input
            style={{ display: 'none' }}
            id="raised-button-file"
            multiple
            type="file"
            onChange={readExcelFile}
            onClick={(event) => (event.currentTarget.value = '')}
          />
          <label htmlFor="raised-button-file">
            <Button
              sx={{ ml: 15, mt: 1.5 }}
              style={{ textTransform: 'none' }}
              variant="contained"
              component="span"
              startIcon={<FileUploadOutlined />}
            >
              Upload Semester Data
            </Button>
          </label>
          <Button
            sx={{ ml: 10, mt: 1.5 }}
            onClick={() => setOpen(true)}
            style={{ textTransform: 'none' }}
            variant="contained"
            component="span"
            startIcon={<DeleteOutline />}
          >
            Clear Semester Data
          </Button>
          <br />
          <br />

          <FacultyStats userRole={role as string} />
          <Dialog
            style={{
              borderImage:
                'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
              boxShadow: '0px 2px 20px 4px #00000040',
              borderRadius: '20px',
              border: '2px solid',
            }}
            PaperProps={{
              style: { borderRadius: 20 },
            }}
            open={open}
            onClose={() => setOpen(false)}
          >
            <DialogTitle
              style={{
                fontFamily: 'SF Pro Display-Medium, Helvetica',
                textAlign: 'center',
                fontSize: '35px',
                fontWeight: '540',
              }}
            >
              Clear Data
            </DialogTitle>
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <DialogContentText
                  style={{
                    marginTop: '35px',
                    fontFamily: 'SF Pro Display-Medium, Helvetica',
                    textAlign: 'center',
                    fontSize: '24px',
                    color: 'black',
                  }}
                >
                  Are you sure you want to clear all existing faculty
                  statistics?
                </DialogContentText>
              </DialogContent>
              <DialogActions
                style={{
                  marginTop: '30px',
                  marginBottom: '42px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '93px',
                }}
              >
                <Button
                  variant="outlined"
                  style={{
                    fontSize: '17px',
                    marginLeft: '110px',
                    borderRadius: '10px',
                    height: '43px',
                    width: '120px',
                    textTransform: 'none',
                    fontFamily: 'SF Pro Display-Bold , Helvetica',
                    borderColor: '#5736ac',
                    color: '#5736ac',
                    borderWidth: '3px',
                  }}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  style={{
                    fontSize: '17px',
                    marginRight: '110px',
                    borderRadius: '10px',
                    height: '43px',
                    width: '120px',
                    textTransform: 'none',
                    fontFamily: 'SF Pro Display-Bold , Helvetica',
                    backgroundColor: '#5736ac',
                    color: '#ffffff',
                  }}
                  type="submit"
                >
                  Delete
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </Box>
      </Box>
    </>
  );
}
