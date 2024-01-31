export const deleteUserHTTPRequest = async (id: string) => {
  // use fetch to send the user's auth ID to the server
  // this goes to a cloud function which deletes the user from firebase auth,
  // officially deleting their account

  const userObject = {
    auth_id: id,
  };

  const response = await fetch(
    'https://us-central1-courseconnect-c6a7b.cloudfunctions.net/deleteUserFromID',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userObject),
    }
  );

  if (response.ok) {
    console.log('SUCCESS: User deleted successfully');
  } else {
    console.log('ERROR: User not deleted');
  }
};
