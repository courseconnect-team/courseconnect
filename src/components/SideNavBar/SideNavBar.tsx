import React from 'react';
import Link from 'next/link';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import handleSignOut from '@/firebase/auth/auth_signout';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { NavbarItem } from '@/types/navigation';
import { usePathname } from 'next/navigation';
import { useBugReport } from '@/contexts/BugReportContext';

const itemBase =
  'flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ease-out';
const itemIdle = 'hover:bg-white/10 hover:text-white';
const bottomItem = `${itemBase} ${itemIdle} w-full text-white/80 cursor-pointer`;
const iconClass = '!text-[26px]';
const labelBase = 'text-[10.5px] leading-[1.15] tracking-wide font-medium';

/**
 * Vertical sidebar navigation that mimics the reference image.
 * - Tailwind handles layout + colours.
 * - MUI supplies crisp SVG icons.
 *
 * Usage: <SideNav onLogout={yourHandler} />
 */
type SideNavProps = {
  navItems: NavbarItem[];
};

export default function SideNav({ navItems }: SideNavProps) {
  const pathname = usePathname();
  const { open: openBugReport } = useBugReport();
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleSubmit = () => {
    handleSignOut();
    setOpen(false);
  };
  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <aside
      data-tour="sidebar"
      className="relative w-20 md:w-24 h-screen bg-[#6C37D8] flex flex-col pt-20 pb-4 shadow-[4px_0_16px_-6px_rgba(45,15,131,0.35)]"
    >
      {/* top + middle items */}
      <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }: NavbarItem) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              data-testid={`nav-${label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`${itemBase} ${
                isActive
                  ? 'bg-white text-[#6C37D8] shadow-sm'
                  : `text-white/85 ${itemIdle}`
              }`}
            >
              <Icon fontSize="inherit" className={iconClass} />
              <span className={`${labelBase} text-center break-words`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* bottom: report a bug + logout */}
      <div className="flex flex-col gap-1 mt-2 flex-shrink-0">
        <button
          onClick={openBugReport}
          aria-label="Report a bug"
          data-tour="report-bug"
          className={bottomItem}
        >
          <BugReportOutlinedIcon fontSize="inherit" className={iconClass} />
          <span className={labelBase}>Report Bug</span>
        </button>
        <button onClick={handleOpen} aria-label="Logout" className={bottomItem}>
          <LogoutOutlinedIcon fontSize="inherit" className={iconClass} />
          <span className={labelBase}>Logout</span>
        </button>
      </div>
      <ConfirmDialog
        open={open}
        title="Logout"
        description="Are you sure you want to logout?"
        onClose={handleClose}
        onConfirm={handleSubmit}
        confirmLabel="Logout"
        confirmColor="error"
      />
    </aside>
  );
}
