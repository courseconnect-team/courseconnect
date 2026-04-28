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

const PURPLE = '#562EBA';

// Normalize a course code the same way the auto-fetch pipeline does
// (`functions/.../normalize.ts`): strip whitespace, uppercase. The result is
// the bare "COP3502" form used inside doc ids.
function normalizeCode(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}

function addCodeSpace(code: string): string {
  const m = code.match(/^([A-Z]{2,4})(\d{3,4}[A-Z]?)$/);
  return m ? `${m[1]} ${m[2]}` : code;
}

function normalizeClassNumber(raw: unknown): string {
  return String(raw ?? '').trim();
}

// Names that mean "no real instructor on file" — same set the auto-fetch
// runner collapses (see `functions/src/courseFetcher/runner.ts`). All map
// to 'TBA' so a course has at most one no-instructor doc per semester.
const PLACEHOLDER_INSTRUCTOR_LOWER = new Set([
  'tba',
  'undef',
  'undefined',
  'unknown',
  '-',
]);

// Stable instructor key used in the doc id. Mirrors
// `instructorKeyFromSection` in `functions/src/courseFetcher/runner.ts`:
// trim + collapse whitespace, fall back to 'TBA' when missing or when the
// source uses a placeholder string. Keeping the two writers aligned means
// re-runs and re-uploads merge into the same doc.
function instructorKey(raw: unknown): string {
  const cleaned = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'TBA';
  if (PLACEHOLDER_INSTRUCTOR_LOWER.has(cleaned.toLowerCase())) return 'TBA';
  return cleaned;
}

// Doc-id shape shared with auto-fetch (`runner.ts::commitCoursesAndSections`).
// One doc per (course, professor); section-level rows for the same prof get
// merged on the same doc so re-uploads (and the auto-fetch pipeline) don't
// produce duplicates.
function semesterCourseDocId(code: string, instructor: string): string {
  // Firestore doc ids cannot contain '/'. Other punctuation (commas in
  // "Smith, John", periods, etc.) is permitted.
  const safeInstructor = instructor.replace(/\//g, '-');
  return `${code} : ${safeInstructor}`;
}

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
      const data: any[] = [];
      workbook.SheetNames.forEach((sheetName) => {
        const sheetData = utils.sheet_to_json(workbook.Sheets[sheetName]);
        sheetData.forEach((row: any) => data.push(row));
      });

      // Group rows by (code, instructor) so multiple sections of the same
      // course taught by the same prof land on a single merged doc instead
      // of overwriting each other. Matches the auto-fetch grouping.
      type RowGroup = {
        code: string;
        instructor: string;
        instructorEmails: string[];
        classNumbers: string[];
        meetingTimes: Array<{ day: string; time: string; location: string }>;
        enrollmentCap: number;
        enrolled: number;
        anyEnrollmentCap: boolean;
        anyEnrolled: boolean;
        credits: unknown;
        title: unknown;
      };
      const groups = new Map<string, RowGroup>();
      let skippedMissingId = 0;
      for (const row of data) {
        const mappedRow: Record<string, any> = {
          Course: row['__EMPTY_1'],
          'Course Title': row['__EMPTY_23'],
          Instructor: row['__EMPTY_24'],
          'Instructor Emails': row['__EMPTY_25'],
          'Class Nbr': row['__EMPTY_6'],
          'Min - Max Cred': row['__EMPTY_11'],
          'Day/s': row['__EMPTY_12'],
          Time: row['__EMPTY_13'],
          Facility: row['__EMPTY_15'],
          'Enr Cap': row['__EMPTY_26'],
          Enrolled: row['__EMPTY_28'],
        };

        const code = normalizeCode(mappedRow['Course']);
        const classNumber = normalizeClassNumber(mappedRow['Class Nbr']);
        if (!code || !classNumber) {
          skippedMissingId++;
          continue;
        }
        const instructor = instructorKey(mappedRow['Instructor']);
        const docId = semesterCourseDocId(code, instructor);

        const rawEmails = mappedRow['Instructor Emails'] ?? 'undef';
        const emailArray: string[] =
          rawEmails === 'undef'
            ? []
            : rawEmails.split(';').map((e: string) => e.trim());

        const cap = Number(mappedRow['Enr Cap']);
        const enr = Number(mappedRow['Enrolled']);

        const group = groups.get(docId);
        if (group) {
          if (!group.classNumbers.includes(classNumber)) {
            group.classNumbers.push(classNumber);
          }
          for (const e of emailArray) {
            if (e && !group.instructorEmails.includes(e)) {
              group.instructorEmails.push(e);
            }
          }
          group.meetingTimes.push({
            day: mappedRow['Day/s']?.replaceAll(' ', '') ?? 'undef',
            time: mappedRow['Time'] ?? 'undef',
            location: mappedRow['Facility'] ?? 'undef',
          });
          if (Number.isFinite(cap)) {
            group.enrollmentCap += cap;
            group.anyEnrollmentCap = true;
          }
          if (Number.isFinite(enr)) {
            group.enrolled += enr;
            group.anyEnrolled = true;
          }
        } else {
          groups.set(docId, {
            code,
            instructor,
            instructorEmails: emailArray.filter(Boolean),
            classNumbers: [classNumber],
            meetingTimes: [
              {
                day: mappedRow['Day/s']?.replaceAll(' ', '') ?? 'undef',
                time: mappedRow['Time'] ?? 'undef',
                location: mappedRow['Facility'] ?? 'undef',
              },
            ],
            enrollmentCap: Number.isFinite(cap) ? cap : 0,
            enrolled: Number.isFinite(enr) ? enr : 0,
            anyEnrollmentCap: Number.isFinite(cap),
            anyEnrolled: Number.isFinite(enr),
            credits: mappedRow['Min - Max Cred'],
            title: mappedRow['Course Title'],
          });
        }
      }

      // Materialize entries first — direct Map iteration needs ES2015+ and
      // the Next config still targets ES5. Array.from is the safe bridge.
      const groupEntries = Array.from(groups.entries());
      for (const [docId, g] of groupEntries) {
        await firebase
          .firestore()
          .collection('semesters')
          .doc(semester)
          .collection('courses')
          .doc(docId)
          .set(
            {
              class_number: g.classNumbers.join(', '),
              class_numbers: g.classNumbers,
              professor_emails: g.instructorEmails,
              professor_usernames: emailsToUsernames(g.instructorEmails),
              professor_names: g.instructor,
              code: g.code,
              codeWithSpace: addCodeSpace(g.code),
              credits: g.credits ?? 'undef',
              department: uploadDeptCode,
              enrollment_cap: g.anyEnrollmentCap
                ? String(g.enrollmentCap)
                : 'undef',
              enrolled: g.anyEnrolled ? String(g.enrolled) : 'undef',
              title: g.title ?? 'undef',
              section_count: g.classNumbers.length,
              semester,
              meeting_times: g.meetingTimes,
              source: 'excel-upload',
            },
            { merge: true }
          );
      }

      if (skippedMissingId > 0) {
        toast(
          `${skippedMissingId} row${
            skippedMissingId === 1 ? '' : 's'
          } skipped: missing course code or class number.`,
          { icon: '⚠️', duration: 4000 }
        );
      }

      setProcessing(false);
      toast.dismiss(toastId);
      toast.success('Data upload complete!', { duration: 2000 });
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
        description="Import an .xlsx/.xls roster to this semester. Rows are keyed by code + instructor — multiple sections taught by the same prof are merged into one course row."
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
