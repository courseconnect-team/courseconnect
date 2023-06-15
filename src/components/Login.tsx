'use client';
import React from 'react';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import firebase from '../firebase/firebase_config';

// Configure FirebaseUI
const uiConfig = {
  // Redirect to / after sign in is successful.
  signInSuccessUrl: '/dashboard',
  // The auth provider shall be email.
  signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
};

var ui = new firebaseui.auth.AuthUI(firebase.auth());

// REPLACE FIREBASE UI WITH CUSTOM LOGIN FORM DESGINED WITH MATERIAL UI

export default function Login() {
  return (
    <>
      <h1>Login component</h1>
      <p>Please sign in:</p>
      <div id="firebaseui-auth-container"></div>
    </>
  );
}

ui.start('#firebaseui-auth-container', uiConfig);
