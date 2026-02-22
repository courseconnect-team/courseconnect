import firebase from '@/firebase/firebase_config';

const FUNCTIONS_BASE_URL =
  process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL ||
  'https://us-central1-courseconnect-c6a7b.cloudfunctions.net';

type CallFunctionOptions = {
  requireAuth?: boolean;
};

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export async function callFunction<T = JsonValue>(
  functionName: string,
  payload: JsonValue,
  options: CallFunctionOptions = {}
): Promise<T> {
  const { requireAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }
    const idToken = await user.getIdToken();
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Cloud Function ${functionName} failed (${response.status}): ${text}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
