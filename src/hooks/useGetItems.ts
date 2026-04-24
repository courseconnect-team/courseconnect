import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { NavbarItem } from '@/types/navigation';
import { SemesterName } from './useSemesterOptions';
import { useMemo } from 'react';
import { Role } from '@/types/User';

// Super admin Departments entry. Appended to the sidebar for users with
// superAdmin === true regardless of their legacy role (a super admin who
// happens to have admin/faculty roles will see the standard items plus
// this one).
const DEPARTMENTS_NAV: NavbarItem = {
  label: 'Departments',
  to: '/admin/departments',
  icon: AccountTreeOutlinedIcon,
};

// Wrap getNavItems with super-admin awareness. Called by HeaderCard so every
// admin-area page gains the Departments entry for super admins without per-
// page changes.
export const getNavItemsForUser = (params: {
  role: Role;
  superAdmin?: boolean;
}): NavbarItem[] => {
  const items = getNavItems(params.role);
  if (params.superAdmin) {
    // Insert before the Help item if present; else append.
    const helpIdx = items.findIndex((i) => i.label === 'Help');
    if (helpIdx >= 0) {
      return [
        ...items.slice(0, helpIdx),
        DEPARTMENTS_NAV,
        ...items.slice(helpIdx),
      ];
    }
    return [...items, DEPARTMENTS_NAV];
  }
  return items;
};

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
        { label: 'Help', to: '/help', icon: HelpOutlineOutlinedIcon },
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
        { label: 'Help', to: '/help', icon: HelpOutlineOutlinedIcon },
      ];

    /* ─────────────────────────────────── Admin ─────────────────────────────────── */
    case 'admin':
      return [
        {
          label: 'Dashboard',
          to: '/admin-stats',
          icon: InsightsOutlinedIcon,
        },
        { label: 'Users', to: '/users', icon: PersonOutlineOutlinedIcon },
        {
          label: 'Applications',
          to: '/admin-applications',
          icon: DescriptionOutlinedIcon,
        },
        { label: 'Courses', to: '/admincourses', icon: BookOutlinedIcon },
        {
          label: 'Course Fetch',
          to: '/admin-course-fetch',
          icon: CloudDownloadOutlinedIcon,
        },
        // {
        //   label: 'Scheduling',
        //   to: '/scheduling',
        //   icon: CalendarTodayOutlinedIcon,
        // },
        {
          label: 'Faculty Stats',
          to: '/faculty-stats',
          icon: BarChartOutlinedIcon,
        },
        { label: 'Research', to: '/Research', icon: ScienceOutlinedIcon },
        {
          label: 'Announcements',
          to: '/announcements',
          icon: CampaignOutlinedIcon,
        },
        { label: 'Help', to: '/help', icon: HelpOutlineOutlinedIcon },
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
