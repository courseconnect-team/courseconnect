import React from 'react';
import Select, { GroupBase } from 'react-select';
import makeAnimated from 'react-select/animated';
import { SelectSemester } from '@/types/User';
// Custom option type

const animatedComponents = makeAnimated();

// Generate semesters as an array of SelectSemester objects
const generateSemesters = (): SelectSemester[] => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const startYear = 2024;
  const semesters: SelectSemester[] = [
    { value: `Spring 2023`, label: `Spring 2023` },
  ];

  for (let year = startYear; year <= currentYear; year++) {
    semesters.push({ value: `Fall ${year - 1}`, label: `Fall ${year - 1}` });

    if (year < currentYear || currentMonth >= 6) {
      semesters.push({ value: `Spring ${year}`, label: `Spring ${year}` });
    }

    if (year < currentYear || currentMonth >= 9) {
      semesters.push({ value: `Summer ${year}`, label: `Summer ${year}` });
    }
  }

  return semesters;
};

interface SemesterSelectionProps {
  selectedSemesters: SelectSemester[];
  setSelectedSemesters: (semesters: SelectSemester[]) => void;
}

const SemesterSelection: React.FC<SemesterSelectionProps> = ({
  selectedSemesters,
  setSelectedSemesters,
}) => {
  // Use the generated semesters
  const allSemesters = generateSemesters();

  // Handle changes from the Select component
  const handleChange = (selectedOptions: any) => {
    setSelectedSemesters(selectedOptions);
  };
  // Custom styles for React Select
  const customStyles = {
    container: (provided: any) => ({
      ...provided,
      width: '600px',
    }),
    control: (provided: any) => ({
      ...provided,
      borderRadius: '', // Rounded border
    }),
  };

  return (
    <div>
      <Select<SelectSemester, true, GroupBase<SelectSemester>>
        closeMenuOnSelect={false}
        components={animatedComponents}
        isMulti
        options={allSemesters}
        value={selectedSemesters}
        onChange={handleChange}
        placeholder="Select Semester"
        styles={customStyles}
      />
    </div>
  );
};

export default SemesterSelection;
