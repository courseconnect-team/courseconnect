import firebase from '@/firebase/firebase_config';

const actionByUFID = new Map<string, string>();
const CURRENT_SEMESTER = 'Fall 2025';
const actionData = require('OnBase Fall 2025 employee(OnBase Fall 2025 employee) - current.csv');

for (const row of actionData) {
  const rawUFID = (row['UFID'] ?? '') as string;
  const action = (row['ECE - Requested Action'] ?? '') as string;

  const ufid = rawUFID.trim();
  const cleanedAction = action.trim();

  if (!ufid || !cleanedAction) continue;

  actionByUFID.set(ufid, cleanedAction);
}

const updateActions = async () => {
  const db = firebase.firestore();
  const batch = db.batch();

  const appsSnap = await db.collection('applications').get();
  appsSnap.forEach((doc) => {
    const data = doc.data();
    const ufid = (data.ufid ?? data.UFID ?? '').toString().trim();
    const semesters = (data.semesters ?? []) as string[];

    if (!Array.isArray(semesters) || !semesters.includes(CURRENT_SEMESTER)) {
      return;
    }

    let action = 'NEW';
    if (ufid && actionByUFID.has(ufid)) {
      action = actionByUFID.get(ufid)!;
    }
    batch.update(doc.ref, { employmentAction: action });
  });
  await batch.commit();
};

updateActions()
  .then(() => {
    console.log('Employment actions updated successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating employment actions:', error);
    process.exit(1);
  });
