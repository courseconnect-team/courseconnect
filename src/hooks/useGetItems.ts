import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { NavbarItem } from '@/types/navigation';
import { SemesterName } from './useSemesterOptions';
import { useMemo } from 'react';
import { Role } from '@/types/User';
export const getNavItems = (userRole: Role): NavbarItem[] => {
  switch (userRole) {
    /* ─────────────────────────────── Student buckets ───────────────────────────── */
    case 'Student':
    case 'student_applied':
    case 'student_applying': // <- you had "student_applying" in code
      return [
        {
          label: 'Applications',
          to: '/applications',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Research', to: '/Research', icon: ScienceOutlinedIcon },
        { label: 'Status', to: '/status', icon: CheckBoxOutlinedIcon },
        {
          label: 'Announcements',
          to: '/announcements',
          icon: CampaignOutlinedIcon,
        },
      ];

    /* ────────────────────────────────── Faculty ────────────────────────────────── */
    case 'faculty':
      return [
        {
          label: 'Applications',
          to: '/applications',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Research', to: '/Research', icon: ScienceOutlinedIcon },
        { label: 'Courses', to: '/courses', icon: BookOutlinedIcon },
        {
          label: 'Announcements',
          to: '/announcements',
          icon: CampaignOutlinedIcon,
        },
      ];

    /* ─────────────────────────────────── Admin ─────────────────────────────────── */
    case 'admin':
      return [
        { label: 'Users', to: '/users', icon: PersonOutlineOutlinedIcon },
        {
          label: 'Applications',
          to: '/admin-applications',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Courses', to: '/admincourses', icon: BookOutlinedIcon },
        {
          label: 'Scheduling',
          to: '/scheduling',
          icon: CalendarTodayOutlinedIcon,
        },
        {
          label: 'Faculty Stats',
          to: '/faculty-stats',
          icon: BarChartOutlinedIcon,
        },
        {
          label: 'Announcements',
          to: '/announcements',
          icon: CampaignOutlinedIcon,
        },
      ];

    /* ───────────────────────────── Roles with no menu ──────────────────────────── */
    case 'unapproved':
    case 'student_accepted':
    case 'student_denied':
    default:
      return []; // empty ⇢ no sidebar items
  }
};

export const getApplications = (userRole: Role): NavbarItem[] => {
  switch (userRole) {
    /* ─────────────────────────────── Student buckets ───────────────────────────── */
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return [
        {
          label: 'Course Assistant',
          to: '/applications/courseAssistant',
          icon: FolderOutlinedIcon,
          type: 'ta',
        },
        {
          label: 'Supervised Teaching',
          to: '/applications/supervisedTeaching',
          icon: FolderOutlinedIcon,
          type: 'supervised-teaching',
        },
      ];

    /* ────────────────────────────────── Faculty ────────────────────────────────── */
    case 'faculty':
      return [
        {
          label: 'Applications',
          to: '/applications',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Courses', to: '/courses', icon: BookOutlinedIcon },
      ];

    /* ─────────────────────────────────── Admin ─────────────────────────────────── */
    case 'admin':
      return [
        { label: 'Users', to: '/users', icon: PersonOutlineOutlinedIcon },
        {
          label: 'Application',
          to: '/application',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Courses', to: '/courses', icon: BookOutlinedIcon },
        {
          label: 'Scheduling',
          to: '/scheduling',
          icon: CalendarTodayOutlinedIcon,
        },
        {
          label: 'Faculty Stats',
          to: '/faculty-stats',
          icon: BarChartOutlinedIcon,
        },
        {
          label: 'Announcements',
          to: '/announcements',
          icon: CampaignOutlinedIcon,
        },
      ];

    /* ───────────────────────────── Roles with no menu ──────────────────────────── */
    case 'unapproved':
    case 'student_accepted':
    case 'student_denied':
    default:
      return []; // empty ⇢ no sidebar items
  }
};

export const getCourses = (userRole: Role): NavbarItem[] => {
  switch (userRole) {
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return [];
    case 'faculty':
      return [
        {
          label: 'Applications',
          to: '/applications',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Courses', to: '/courses', icon: BookOutlinedIcon },
      ];
    case 'admin':
      return [
        { label: 'Users', to: '/users', icon: PersonOutlineOutlinedIcon },
        {
          label: 'Application',
          to: '/application',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Courses', to: '/courses', icon: BookOutlinedIcon },
        {
          label: 'Scheduling',
          to: '/scheduling',
          icon: CalendarTodayOutlinedIcon,
        },
        {
          label: 'Faculty Stats',
          to: '/faculty-stats',
          icon: BarChartOutlinedIcon,
        },
        {
          label: 'Announcements',
          to: '/announcements',
          icon: CampaignOutlinedIcon,
        },
      ];
    default:
      return [];
  }
};
