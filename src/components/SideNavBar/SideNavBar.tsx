import React from 'react';
import Link from 'next/link';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import handleSignOut from '@/firebase/auth/auth_signout';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { NavbarItem } from '@/types/navigation';
import { usePathname } from 'next/navigation';
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
    <aside className="relative w-20 md:w-24 h-screen bg-[#6C37D8] flex flex-col justify-between pt-20 pb-4 shadow-[4px_0_16px_-6px_rgba(45,15,131,0.35)]">
      {/* top + middle items */}
      <nav className="flex flex-col gap-1.5 px-2">
        {navItems.map(({ label, to, icon: Icon }: NavbarItem) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              data-testid={`nav-${label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200 ease-out ${
                isActive
                  ? 'bg-white text-[#6C37D8] shadow-sm'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-white transition-all duration-200 ease-out ${
                  isActive
                    ? 'h-8 opacity-100'
                    : 'h-0 opacity-0 group-hover:h-5 group-hover:opacity-70'
                }`}
              />
              <Icon fontSize="inherit" className="!text-[26px]" />
              <span className="text-[10.5px] leading-[1.15] tracking-wide text-center font-medium break-words">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* bottom logout */}
      <div className="px-2">
        <button
          onClick={handleOpen}
          aria-label="Logout"
          className="w-full flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 ease-out"
        >
          <LogoutOutlinedIcon fontSize="inherit" className="!text-[26px]" />
          <span className="text-[10.5px] leading-[1.15] tracking-wide font-medium">
            Logout
          </span>
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
