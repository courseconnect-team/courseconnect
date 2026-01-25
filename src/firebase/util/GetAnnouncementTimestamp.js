import { useState, useMemo, useEffect } from 'react';
import { useDocument } from 'react-firebase-hooks/firestore';
import firebase from '@/firebase/firebase_config';
import { isE2EMode, getE2ERole } from '@/utils/featureFlags';

const GetAnnouncementTimestamp = (userId) => {
  const [timestamp, setTimestamp] = useState('');

  //Testing Code Start
  const stubtimeStamp = Date(0);
  const STUB = [stubtimeStamp, false, null];

  const e2e = isE2EMode();
  //Testing Code End

  const docRef = useMemo(() => {
    if (e2e || !userId) return null;
    return firebase.firestore().collection('users').doc(userId);
  }, [e2e, userId]);
  const [snapshot, loading, error] = useDocument(docRef);

  useEffect(() => {
    if (e2e) return;
    if (!docRef) return;

    const data = snapshot?.data();
    if (!data) return;

    if (data.timestamp) {
      setTimestamp(data.lastSeenAnnouncementsAt);
    } else {
      //Temp Code
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      const lastYearTs = firebase.firestore.Timestamp.fromDate(d);

      setTimestamp(lastYearTs);
    }
  }, [e2e, snapshot, docRef]);

  if (e2e) return STUB;
  return [timestamp, loading, error];
};

export default GetAnnouncementTimestamp;
