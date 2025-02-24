import { NextResponse } from 'next/server';
const { db } = require('../../../../functions/src/index');

export async function GET() {
  try {
    const snapshot = await db.collection('research-listings').get();
    const researchListings = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(researchListings);
  } catch (error) {
    console.error('Error fetching research listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research listings' },
      { status: 500 }
    );
  }
}
