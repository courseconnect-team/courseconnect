// hooks/useFacultyStats.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firebase from '@/firebase/firebase_config';
import { useEffect } from 'react';
import { FacultyStats } from '@/types/User';
// Fetch function using Firestore's get method

const fetchFacultyStats = async (): Promise<FacultyStats[]> => {
  const snapshot = await firebase.firestore().collection('faculty').get();
  const data = snapshot.docs.map((doc) => {
    const { id, instructor, research_level } = doc.data();
    let load = 18;
    if (research_level == "Low") {
      load = 12;
    } else if (research_level == "Mid") {
      load = 9;
    } else if (research_level == "High") {
      load = 6;
    }

    return {
      id: id,
      instructor: instructor,
      research_level: research_level,
      teaching_load: load,
    };
  }) as FacultyStats[];
  return data;
};

// Delete function
const deleteFacultyStat = async (id: string): Promise<void> => {
  await firebase.firestore().collection('faculty').doc(id).delete();
};

// Function to update a faculty stat
const updateFacultyStat = async (stat: FacultyStats): Promise<void> => {
  const { id, isNew, mode, ...data } = stat; // Exclude UI state fields
  await firebase.firestore().collection('faculty').doc(id).update(data);
};

// Custom hook to manage faculty stats with real-time updates
const useFacultyStats = () => {
  const queryClient = useQueryClient();

  // Set up the real-time listener
  useEffect(() => {
    const statsRef = firebase.firestore().collection('faculty');
    const unsubscribe = statsRef.onSnapshot(
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
          const { id, instructor, research_level } = doc.data();
          let load = 18;
          if (research_level == "Low") {
            load = 12;
          } else if (research_level == "Mid") {
            load = 9;
          } else if (research_level == "High") {
            load = 6;
          }

          return {
            id: id,
            instructor: instructor,
            research_level: research_level,
            teaching_load: load,
          };
        }) as FacultyStats[];
        console.log(data);

        // Update React Query's cache
        queryClient.setQueryData(['facultyStats'], data);
      },
      (error) => {
        console.error('Error fetching faculty stats: ', error);
        // Optionally, handle errors here (e.g., set an error state)
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [queryClient]);

  // Initial fetch to populate cache
  const query = useQuery({
    queryKey: ['facultyStats'],
    queryFn: fetchFacultyStats,
  });
  return query;
};

const useDeleteFacultyStat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFacultyStat,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['facultyStats'] });
    },
    onError: (error: any) => {
      console.error('Error deleting faculty stat:', error);
      // Optionally, show a notification or alert to the user
    },
  });
};

// Custom hook for updating a faculty stat
const useUpdateFacultyStat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFacultyStat,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['facultyStats'] });
    },
    onError: (error: any) => {
      console.error('Error updating faculty stat:', error);
      // Optionally, show a notification or alert to the user
    },
  });
};

export { useFacultyStats, useDeleteFacultyStat, useUpdateFacultyStat };
