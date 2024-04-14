'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DepartmentSelect from '@/components/FormUtil/DepartmentSelect';
import GPA_Select from '@/components/FormUtil/GPASelect';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DegreeSelect from '@/components/FormUtil/DegreeSelect';
import SemesterStatusSelect from '@/components/FormUtil/SemesterStatusSelect';
import NationalitySelect from '@/components/FormUtil/NationalitySelect';
import ProficiencySelect from '@/components/FormUtil/ProficiencySelect';
import PositionSelect from '@/components/FormUtil/PositionSelect';
import AvailabilityCheckbox from '@/components/FormUtil/AvailabilityCheckbox';
import SemesterCheckbox from '@/components/FormUtil/SemesterCheckbox';
import AdditionalSemesterPrompt from '@/components/FormUtil/AddtlSemesterPrompt';
import UpdateRole from '@/firebase/util/UpdateUserRole';
import { useAuth } from '@/firebase/auth/auth_context';
import { Toaster, toast } from 'react-hot-toast';
import { CircularProgress, IconButton, LinearProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { ApplicationStatusCard } from '@/components/ApplicationStatusCard/ApplicationStatusCard';
import { useState } from 'react';
import { TopNavBarSigned } from '@/components/TopNavBarSigned/TopNavBarSigned';
import { EceLogoPng } from '@/components/EceLogoPng/EceLogoPng';
import Users from '@/components/Dashboard/Users/Users';

import GetUserRole from '@/firebase/util/GetUserRole';
import GetUserUfid from '@/firebase/util/GetUserUfid';
import { ApplicationStatusCardDenied } from '@/components/ApplicationStatusCardDenied/ApplicationStatusCardDenied';

import { ApplicationStatusCardAccepted } from '@/components/ApplicationStatusCardAccepted/ApplicationStatusCardAccepted';
import styles from "./style.module.css";
import 'firebase/firestore';

import firebase from '@/firebase/firebase_config';
import { read, utils, writeFile, readFile } from 'xlsx';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Courses from '@/components/Dashboard/AdminCourses/Courses';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { DeleteOutline, FileUploadOutlined, UploadFile } from '@mui/icons-material';

export default function User() {
  const { user } = useAuth();
  const [role, loading, error] = GetUserRole(user?.uid);
  const [activeComponent, setActiveComponent] = React.useState('welcome');
  const [semester, setSemester] = React.useState('');
  const [menu, setMenu] = React.useState([]);
  const [processing, setProcessing] = React.useState(false);


  const handleChange = (event: SelectChangeEvent) => {
    setSemester(event.target.value as string);
    if (event.target.value == "New Semester") {
      setOpen(true);
    }
    console.log(open);

  };

  const [newSem, setNewSem] = useState("");
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setSemester('');
    setOpen(false);
  }
  const handleSemesterCreate = async (e) => {
    //handleSignOut();
    e.preventDefault();
    await firebase
      .firestore()
      .collection('semesters')
      .doc(newSem)
      .set({
        semester: newSem,
      })

    setSemester(newSem);

    setOpen(false);
  }

  React.useEffect(() => {
    const updateMenu = async () => {

      let arr = []
      const doc = await firebase.firestore()
        .collection("semesters")
        .get().then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            arr.push(doc.id)
            if (semester == '') {
              setSemester(doc.id)
            }
          });
        });

      setMenu(arr);
    }

    updateMenu();
  }, [semester, processing]);

  const handleDeleteSem = async () => {
    setProcessing(true);
    const toastId = toast.loading("Clearing semester data. This may take a couple minutes.", {
      duration: 30000000,
    });

    await firebase.firestore().collection('courses').where("semester", "==", semester).get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        doc.ref.delete();
      });
    });

    setProcessing(false);
    toast.success("Semester data cleared!")

    toast.dismiss(toastId);
  }

  const readExcelFile = async (e) => {
    // https://docs.sheetjs.com/docs/demos/local/file/
    console.log("ACTIVE");

    try {
      setProcessing(true);
      const toastId = toast.loading("Processing course data. This may take a couple minutes.", {
        duration: 300000000,
      });

      const val = e.target.files[0];
      console.log(val);
      const ab = await val.arrayBuffer()
      let data = []
      var file = read(ab);

      const sheets = file.SheetNames
      console.log(sheets);

      for (let i = 0; i < sheets.length; i++) {
        const temp = utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]])
        console.log(temp);

        temp.forEach((res) => {
          data.push(res)
        })
      }
      console.log(data);
      console.log(data.length);

      for (let i = 0; i < data.length; i++) {

        await firebase
          .firestore()
          .collection('courses')
          .doc(data[i]["__EMPTY_5"] + " (" + semester + ") " + ": " + data[i]["__EMPTY_22"])
          .set({
            professor_emails: (data[i]["__EMPTY_23"] == undefined ? "undef" : data[i]["__EMPTY_23"]),
            professor_names: (data[i]["__EMPTY_22"] == undefined ? "undef" : data[i]["__EMPTY_22"]),
            code: (data[i]["__EMPTY_5"] == undefined ? "undef" : data[i]["__EMPTY_5"]),
            credits: (data[i]["__EMPTY_9"] == undefined ? "undef" : data[i]["__EMPTY_9"]),
            enrollment_cap: (data[i]["__EMPTY_24"] == undefined ? "undef" : data[i]["__EMPTY_24"]),
            enrolled: (data[i]["__EMPTY_26"] == undefined ? "undef" : data[i]["__EMPTY_26"]),
            title: (data[i]["__EMPTY_21"] == undefined ? "undef" : data[i]["__EMPTY_21"]),
            semester: semester,
          })

        console.log(data[i]["__EMPTY_5"]);


      }


      setProcessing(false);
      toast.dismiss(toastId);

      toast.success("Data upload complete!", {
        duration: 2000,
      })


    }
    catch (err) {
      console.log(err);
      setProcessing(false);
    }
  }

  return (
    <>
      <Toaster />
      <div className={styles.studentlandingpage}>
        <Dialog style={{ borderImage: "linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1", boxShadow: "0px 2px 20px 4px #00000040", borderRadius: "20px", border: "2px solid" }} PaperProps={{
          style: { borderRadius: 20 }
        }} open={open} onClose={handleClose} >
          <DialogTitle style={{ fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "40px", fontWeight: "540" }}>Create Semester</DialogTitle>
          <form onSubmit={e => handleSemesterCreate(e)}>
            <DialogContent>
              <DialogContentText style={{ marginTop: "35px", fontFamily: "SF Pro Display-Medium, Helvetica", textAlign: "center", fontSize: "20px", color: "black" }}>
                Please enter the new semester&apos;s name.
              </DialogContentText>
              <br />
              <br />

              <FormControl required>
                <TextField
                  style={{ left: "160px" }}
                  name="Semester"
                  variant="filled"
                  onChange={val => setNewSem(val.target.value)}
                  required
                  fullWidth
                  id="Semester"
                  label="Semester"
                  autoFocus
                />
              </FormControl>
            </DialogContent>
            <DialogActions style={{ marginTop: "30px", marginBottom: "42px", display: "flex", justifyContent: "space-between", gap: "93px" }}>
              <Button variant="outlined" style={{ fontSize: "17px", marginLeft: "110px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", borderColor: '#5736ac', color: '#5736ac', borderWidth: "3px" }} onClick={handleClose}>Cancel</Button>

              <Button variant="contained" style={{ fontSize: "17px", marginRight: "110px", borderRadius: "10px", height: '43px', width: '120px', textTransform: "none", fontFamily: "SF Pro Display-Bold , Helvetica", backgroundColor: '#5736ac', color: '#ffffff' }} type="submit">Confirm</Button>
            </DialogActions>
          </form>
        </Dialog>
        <div className={styles.overlapwrapper}>
          <div className={styles.overlap}>
            <div className={styles.overlap2}>
              <div className={styles.colorblockframe}>
                <div className={styles.overlapgroup2}>
                  <div className={styles.colorblock} />
                  <img className={styles.GRADIENTS} alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                  <div className={styles.glasscard} />
                </div>
              </div>
              <EceLogoPng className={styles.ecelogopng2} />
              <TopNavBarSigned className={styles.topnavbarsignedin} />
              <div className={styles.textwrapper8}>Courses</div>
            </div>

            <CssBaseline />
            <Box
              sx={{
                marginTop: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Box sx={{ minWidth: 120 }}>

              </Box>
              <Box sx={{ mt: 50, mb: 2, width: '100%' }}>
                <input
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  multiple
                  type="file"
                  onChange={e => readExcelFile(e)}
                  onClick={event => event.target.value = null}



                />

                <label htmlFor="raised-button-file">
                  <Button sx={{ ml: 40, mt: 1.5 }} style={{ textTransform: "none" }} variant="contained" component="span" startIcon={<FileUploadOutlined />}>
                    Upload Semester Data
                  </Button>
                </label>

                <Button sx={{ ml: 10, mt: 1.5 }} onClick={e => { e.preventDefault(); handleDeleteSem(); }} style={{ textTransform: "none" }} variant="contained" component="span" startIcon={<DeleteOutline />}>
                  Clear Semester Data
                </Button>



                <FormControl sx={{ ml: 70, mb: 5, minWidth: 140, }}>
                  <InputLabel id="demo-simple-select-label">Semester</InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={semester}
                    label="Semester"
                    onChange={handleChange}
                  >
                    {menu.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>
                    )}
                    <MenuItem value={"New Semester"}>Create New Semester</MenuItem>
                  </Select>
                </FormControl>
                <br />
                <Courses userRole={role as string} semester={semester} processing={processing} />



              </Box>
            </Box>

          </div>

        </div>

      </div>
    </>

  );
}
