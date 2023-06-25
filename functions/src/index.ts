/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// export const createUserDocument = functions.auth.user().onCreate((user) => {
//   db.collection('users')
//     .doc(user.uid)
//     .set(JSON.parse(JSON.stringify(user)));
// });

export const processSignUpForm = functions.https.onRequest(
  (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
    } else {
      // Handle other requests

      // Extract user object data from post request
      const userObject = {
        firstname: request.body.firstname,
        lastname: request.body.lastname,
        email: request.body.email,
        password: request.body.password,
        department: request.body.department,
        role: request.body.role,
        ufid: request.body.ufid,
        uid: request.body.uid,
      };

      // Create the document within the "users" collection
      db.collection('users')
        .doc(userObject.uid)
        .set(userObject)
        .then(() => {
          response.status(200).send('User created successfully');
        })
        .catch((error: any) => {
          response.status(500).send('Error creating user: ' + error.message);
        });
    }
  }
);

export const processApplicationForm = functions.https.onRequest(
  (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
    } else {
      // Handle other requests

      // Extract user object data from post request
      const applicationObject = {
        firstname: request.body.firstname,
        lastname: request.body.lastname,
        email: request.body.email,
        ufid: request.body.ufid,
        phonenumber: request.body.phonenumber,
        department: request.body.department,
        degree: request.body.degree,
        semesterstatus: request.body.semesterstatus,
        nationality: request.body.nationality,
        englishproficiency: request.body.englishproficiency,
        position: request.body.position,
        available_hours: request.body.available_hours,
        available_semesters: request.body.available_semesters,
        courses: request.body.courses,
        qualifications: request.body.qualifications,
        uid: request.body.uid,
        date: request.body.date,
      };

      // Create the document within the "users" collection
      db.collection('applications')
        .doc(applicationObject.uid)
        .set(applicationObject)
        .then(() => {
          response.status(200).send('Application created successfully');
        })
        .catch((error: any) => {
          response
            .status(500)
            .send('Error creating application: ' + error.message);
        });
    }
  }
);

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
