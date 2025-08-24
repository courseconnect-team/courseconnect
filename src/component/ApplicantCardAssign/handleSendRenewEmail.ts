// export function handleSendRenewEmail = async (firstName: string, lastName: string, email:string, position: string, classCode: string) => {
//     try {

//         // Send email using fetched application data
//         const response = await fetch(
//           'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/sendEmail',
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               type: 'renewTA',
//               data: {
//                 user: {
//                   name: `${firstName?? ''} ${
//                     lastName ?? ''
//                   }`.trim(),
//                   email: email,
//                 },
//                 position: position,
//                 classCode: classCode,
//               },
//             }),
//           }
//         );

//         if (response.ok) {
//           const data = await response.json();
//           console.log('Email sent successfully:', data);
//         } else {
//           throw new Error('Failed to send email');
//         }

//     } catch (error) {
//       console.error('Error sending email:', error);
//     }
//   };
