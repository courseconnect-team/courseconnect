'use client';
import React from 'react';
import firebase from '../firebase/firebase_config';
// useAuthState is a hook that returns the current user object from Firebase
import { useAuthState } from 'react-firebase-hooks/auth';
// useCollection is a hook that returns a collection from Firestore
import { useCollection } from 'react-firebase-hooks/firestore';

export default function UserDisplay() {
  // define the firestore database variable
  const db = firebase.firestore();

  // TS solution from here: https://stackoverflow.com/questions/70628540/argument-of-type-firebase-default-auth-auth-is-not-assignable-to-parameter-of
  // destructure user, loading, and error out of the hook.
  const [user, loading, error] = useAuthState(firebase.auth() as any);
  // display result in console for debugging purposes
  console.log('Loading: ', loading, '|', 'Current user: ', user);

  // destructure collection and collection loading state out of the hook.
  const [votes, votesLoading, votesError] = useCollection(
    firebase.firestore().collection('votes') as any,
    {}
  );
  // if the votes are NOT loading anymore and they are valid, then map over the votes and console.log each vote.
  if (!votesLoading && votes) {
    votes.docs.map((doc) => console.log(doc.data()));
  }

  // Create document function
  const addVoteDocument = async (vote: string) => {
    await db.collection('votes').doc(user?.uid).set({
      vote,
    });
  };

  // follow along with this video: https://www.youtube.com/watch?v=awd_oYcmrRA

  return (
    <>
      <h1>Welcome, {user?.displayName}!</h1>

      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          style={{ fontSize: 32, marginRight: 8 }}
          onClick={() => addVoteDocument('yes')}
        >
          Pineapple
        </button>
        <button
          style={{ fontSize: 32, marginRight: 8 }}
          onClick={() => addVoteDocument('no')}
        >
          No Pineapple
        </button>
      </div>
    </>
  );
}
