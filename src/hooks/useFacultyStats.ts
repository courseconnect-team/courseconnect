// hooks/useFacultyStats.ts
'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import firebase from '@/firebase/firebase_config';
import { FacultyStats } from '@/types/User';
import { isE2EMode } from '@/utils/featureFlags';

const computeLoad = (research_level: string) => {
  if (research_level === 'Low') return 12;
  if (research_level === 'Mid') return 9;
  if (research_level === 'High') return 6;
  return 18;
};

const fetchFacultyStats = async (): Promise<FacultyStats[]> => {
  const snapshot = await firebase.firestore().collection('faculty').get();
  return snapshot.docs.map((doc) => {
    const { id, instructor, research_level } = doc.data() as any;
    return {
      id,
      instructor,
      research_level,
      // teaching_load: computeLoad(research_level),
    } satisfies FacultyStats;
  });
};

const STUB: FacultyStats[] = [
  {
    id: 'stub',
    instructor: 'Stub Instructor',
    research_level: 'Low',
    // teaching_load: 12,
  },
];

const deleteFacultyStat = async (id: string): Promise<void> => {
  await firebase.firestore().collection('faculty').doc(id).delete();
};

const updateFacultyStat = async (stat: FacultyStats): Promise<void> => {
  const { id, isNew, mode, ...data } = stat as any;
  await firebase.firestore().collection('faculty').doc(id).update(data);
};

export const useFacultyStats = () => {
  const queryClient = useQueryClient();
  const isE2E = isE2EMode();
  //         const newData = querySnapshot.docs.reduce((acc, doc) => {
  //           const docData = doc.data();
  //           acc[doc.id] = {
  //             id: doc.id,
  //             accumulatedUnits: docData.accumulatedUnits ?? 0,
  //             assignedUnits: docData.assignedUnits ?? 0,
  //             averageUnits: docData.averageUnits ?? 0,
  //             creditDeficit: docData.creditDeficit ?? 0,
  //             creditExcess: docData.creditExcess ?? 0,
  //             email: docData.email ?? '',
  //             firstname: docData.firstname ?? '',
  //             labCourse: docData.labCourse ?? false,
  //             lastname: docData.lastname ?? '',
  //             researchActivity: docData.research ?? '',
  //             classesTaught: docData.totalClasses ?? 0,
  //             ufid: docData.ufid ?? 0,
  //             isNew: false,
  //             mode: 'view',
  //           };
  //           return acc;
  //         }, {} as Record<string, FacultyStats>);
  // Subscribe to realtime updates (skip in E2E so Firebase doesn't run)
  useEffect(() => {
    if (isE2E) return;

    const statsRef = firebase.firestore().collection('faculty');
    const unsubscribe = statsRef.onSnapshot(
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
          const { id, instructor, research_level } = doc.data() as any;
          return {
            id,
            instructor,
            research_level,
            // teaching_load: computeLoad(research_level),
          } satisfies FacultyStats;
        });

        queryClient.setQueryData(['facultyStats'], data);
      },
      (error) => console.error('Error fetching faculty stats:', error)
    );

    return () => unsubscribe();
  }, [isE2E, queryClient]);

  return useQuery<FacultyStats[]>({
    queryKey: ['facultyStats'],
    queryFn: isE2E ? async () => STUB : fetchFacultyStats,
    placeholderData: STUB,
    staleTime: isE2E ? Infinity : 5 * 60 * 1000,
  });
};

export const useDeleteFacultyStat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFacultyStat,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['facultyStats'] }),
  });
};

export const useUpdateFacultyStat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFacultyStat,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['facultyStats'] }),
  });
};
