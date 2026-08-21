'use client';

import * as React from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'react-hot-toast';
import { read, utils } from 'xlsx';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { emailsToUsernames } from '@/utils/email';
import {
  parseScheduleOfClasses,
  type ScheduleCourseGroup,
} from '@/utils/scheduleOfClasses';

const PURPLE = '#562EBA';

// Firestore caps a WriteBatch at 500 operations.
const BATCH_LIMIT = 500;

export interface UploadPanelProps {
  semester: string;
  uploadDeptCode: string;
  currentSemesterForActions: string;
  processing: boolean;
  setProcessing: (v: boolean) => void;
}

function UploadCard(props: {
  title: string;
  description: string;
  action: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{props.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {props.description}
        </Typography>
      </Stack>
      {props.action}
    </Paper>
  );
}

export default function UploadPanel({
  semester,
  uploadDeptCode,
  currentSemesterForActions,
  processing,
  setProcessing,
}: UploadPanelProps) {
  const handleSemesterUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProcessing(true);
    const toastId = toast.loading(
      'Processing course data. This may take a couple minutes.',
      { duration: 300000000 }
    );
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setProcessing(false);
        toast.dismiss(toastId);
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);

      // Read as arrays-of-cells rather than objects: the Schedule of Classes
      // report buries its header several rows down under a title/legend
      // block, so there is no usable object key until we find that row
      // ourselves. `raw: false` keeps class numbers and section numbers as
      // the source's zero-padded strings.
      const rows: unknown[][] = [];
      workbook.SheetNames.forEach((sheetName) => {
        const sheetRows = utils.sheet_to_json<unknown[]>(
          workbook.Sheets[sheetName],
          { header: 1, raw: false, defval: null, blankrows: false }
        );
        sheetRows.forEach((row) => rows.push(row));
      });

      const parsed = parseScheduleOfClasses(rows);
      if (parsed.headerRowIndex === -1 || parsed.missingColumns.length > 0) {
        setProcessing(false);
        toast.dismiss(toastId);
        toast.error(
          `Could not read this file: no header row with ${parsed.missingColumns.join(
            ' and '
          )}. Export the Department View Schedule of Classes as .xlsx and retry.`,
          { duration: 8000 }
        );
        return;
      }
      if (parsed.groups.length === 0) {
        setProcessing(false);
        toast.dismiss(toastId);
        toast.error('No course rows found in this file.', { duration: 5000 });
        return;
      }

      const db = firebase.firestore();
      const coursesRef = db
        .collection('semesters')
        .doc(semester)
        .collection('courses');

      // Chunked batches instead of one round trip per doc — a full
      // department export is a few hundred courses.
      for (let i = 0; i < parsed.groups.length; i += BATCH_LIMIT) {
        const batch = db.batch();
        parsed.groups
          .slice(i, i + BATCH_LIMIT)
          .forEach((g: ScheduleCourseGroup) => {
            batch.set(
              coursesRef.doc(g.docId),
              {
                // Back-compat single string; new code reads `class_numbers`.
                class_number: g.classNumbers.join(', '),
                class_numbers: g.classNumbers,
                professor_emails: g.instructorEmails,
                professor_usernames: emailsToUsernames(g.instructorEmails),
                professor_names: g.instructor,
                code: g.code,
                codeWithSpace: g.codeWithSpace,
                credits: g.credits || 'undef',
                department: uploadDeptCode,
                enrollment_cap: g.enrollmentCap || 'undef',
                enrolled: g.enrolled || 'undef',
                title: g.title || 'undef',
                title_section: g.sectionNumbers.join(', '),
                section_count: g.classNumbers.length,
                semester,
                meeting_times: g.meetingTimes,
                source: 'excel-upload',
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          });
        await batch.commit();
      }

      setProcessing(false);
      toast.dismiss(toastId);
      toast.success(
        `Uploaded ${parsed.groups.length} course${
          parsed.groups.length === 1 ? '' : 's'
        } from ${parsed.dataRowCount} row${
          parsed.dataRowCount === 1 ? '' : 's'
        }.`,
        { duration: 4000 }
      );
      if (parsed.skippedCancelled > 0) {
        toast(
          `${parsed.skippedCancelled} cancelled section${
            parsed.skippedCancelled === 1 ? '' : 's'
          } skipped.`,
          { icon: 'ℹ️', duration: 4000 }
        );
      }
      if (parsed.skippedMissingId > 0) {
        toast(
          `${parsed.skippedMissingId} row${
            parsed.skippedMissingId === 1 ? '' : 's'
          } skipped: missing course code or class number.`,
          { icon: '⚠️', duration: 4000 }
        );
      }
    } catch (err) {
      console.error(err);
      setProcessing(false);
      toast.dismiss(toastId);
      toast.error('Data upload failed.', { duration: 2000 });
    }
  };

  const handleEmploymentActionsUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProcessing(true);
    const toastId = toast.loading('Processing employment actions.', {
      duration: 300000000,
    });
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setProcessing(false);
        toast.dismiss(toastId);
        toast.error('No file selected.', { duration: 2000 });
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);
      const data: any[] = [];
      workbook.SheetNames.forEach((sheetName) => {
        const sheetData = utils.sheet_to_json(workbook.Sheets[sheetName]);
        sheetData.forEach((row: any) => data.push(row));
      });

      const actionByUFID = new Map<string, string>();
      for (const row of data) {
        const rawUFID = String(row['UFID'] ?? '');
        const action = (row['ECE - Requested Action'] ?? '') as string;
        const ufid = rawUFID.trim();
        const cleanedAction = action.trim();
        if (!ufid || !cleanedAction) continue;
        actionByUFID.set(ufid, cleanedAction);
      }

      const db = firebase.firestore();
      const batch = db.batch();
      const appsSnap = await db.collection('applications').get();

      appsSnap.forEach((doc) => {
        const data = doc.data() as Record<string, any>;
        const ufid = (data.ufid ?? data.UFID ?? '').toString().trim();
        const semesters = (data.available_semesters ?? []) as string[];
        if (
          !Array.isArray(semesters) ||
          !semesters.includes(currentSemesterForActions)
        ) {
          return;
        }
        let action = 'NEW HIRE';
        if (ufid && actionByUFID.has(ufid)) {
          action = actionByUFID.get(ufid)!;
        }
        batch.update(doc.ref, { employmentAction: action });
      });
      await batch.commit();

      setProcessing(false);
      toast.dismiss(toastId);
      toast.success('Employment actions updated.', { duration: 2000 });
    } catch (err) {
      console.error(err);
      setProcessing(false);
      toast.dismiss(toastId);
      toast.error('Upload failed.', { duration: 2000 });
    }
  };

  const handleClearSemester = async () => {
    if (
      !window.confirm(
        `Delete ALL courses in "${semester}"? This cannot be undone. Auto-fetch workflows can re-populate the semester afterward.`
      )
    )
      return;
    setProcessing(true);
    const toastId = toast.loading('Clearing semester.', { duration: 30000000 });
    const snap = await firebase
      .firestore()
      .collection('semesters')
      .doc(semester)
      .collection('courses')
      .get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
    }
    setProcessing(false);
    toast.dismiss(toastId);
    toast.success('Semester cleared.');
  };

  return (
    <Stack spacing={2}>
      <UploadCard
        title="Upload semester course data"
        description="Import a Department View Schedule of Classes export (.xlsx/.xls/.csv) to this semester. Columns are matched by header name, so column order can change between exports. Rows are keyed by code + instructor — multiple sections taught by the same prof are merged into one course row."
        action={
          <Button
            component="label"
            variant="contained"
            disableElevation
            startIcon={<FileUploadOutlinedIcon />}
            disabled={processing}
            sx={{
              textTransform: 'none',
              bgcolor: PURPLE,
              '&:hover': { bgcolor: '#4524a0' },
            }}
          >
            Choose file
            <input
              hidden
              type="file"
              accept=".xlsx,.xls,.csv"
              onClick={(e) => (e.currentTarget.value = '')}
              onChange={handleSemesterUpload}
            />
          </Button>
        }
      />
      <UploadCard
        title="Upload employment actions"
        description="Import UFID → requested action from an .xlsx to tag applications for the current hiring semester."
        action={
          <Button
            component="label"
            variant="outlined"
            startIcon={<FileUploadOutlinedIcon />}
            disabled={processing}
            sx={{ textTransform: 'none' }}
          >
            Choose file
            <input
              hidden
              type="file"
              accept=".xlsx,.xls,.csv"
              onClick={(e) => (e.currentTarget.value = '')}
              onChange={handleEmploymentActionsUpload}
            />
          </Button>
        }
      />
      <UploadCard
        title="Clear semester courses"
        description="Remove every course doc for this semester — both manually uploaded and auto-fetched. Run a workflow afterward to repopulate."
        action={
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            disabled={processing}
            onClick={handleClearSemester}
            sx={{ textTransform: 'none' }}
          >
            Clear {semester || 'semester'}
          </Button>
        }
      />
    </Stack>
  );
}
