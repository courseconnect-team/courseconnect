// make a route that returns hello world

import { NextResponse } from 'next/server';
import { ResearchListing } from '@/app/models/ResearchModel';
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const department = url.searchParams.get('department');

    // Retrieve the student_levels parameter(s) as an array.
    let studentLevels: string[] = url.searchParams.getAll('student_levels');
    if (studentLevels.length === 0) {
      const param = url.searchParams.get('student_levels');
      if (param) {
        studentLevels = param.split(',').map((s) => s.trim());
      }
    }

    // Begin building the query by department (or any other Firestore-queryable filter).
    let queryRef = db.collection('research-listings');
    if (department) {
      queryRef = queryRef.where('department', '==', department);
    }
    if (studentLevels.length > 0) {
      studentLevels.forEach((level) => {
        queryRef = queryRef.whereField(level, true);
      });
    }
    // Execute the query.
    const snapshot = await queryRef.get();
    let researchListings: ResearchListing[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // If studentLevels filter is provided, perform local filtering.
    // We check that for each listing, at least one of the requested student levels is true.

    return NextResponse.json(researchListings);
  } catch (error) {
    console.error('Error fetching research listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research listings' },
      { status: 500 }
    );
  }
}
