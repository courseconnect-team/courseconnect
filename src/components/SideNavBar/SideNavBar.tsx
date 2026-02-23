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
    <div className="w-14 md:w-20 h-screen bg-[#6C37D8] flex flex-col justify-between items-center pt-14 pb-6">
      {/* top + middle items */}
      <div className="flex flex-col space-y-4 mt-5">
        {navItems.map(({ label, to, icon: Icon }: NavbarItem) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              data-testid={`nav-${label}`}
              className={`
              group relative flex flex-col items-center text-5xl px-2 py-1 duration-200
              ${isActive ? 'bg-white text-primary' : 'text-white '}
                hover:border-r-4 "rounded-sm border-black]
            `}
            >
              <Icon
                fontSize="inherit"
                className={`  
              ${isActive ? 'bg-white text-primary' : 'text-white '}`}
              />
              <span
                className={`text-[12px] mt-1 tracking-wide text-center   ${
                  isActive ? 'bg-white text-primary' : 'text-white '
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* bottom logout */}
      <button
        onClick={handleOpen}
        className="!text-[#FFFFFF] cursor-pointer flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity duration-200"
      >
        <LogoutOutlinedIcon className="text-white text-5xl" />
        <span className="text-white text-[13px] mt-1 tracking-wide">
          Logout
        </span>
      </button>
      <ConfirmDialog
        open={open}
        title="Logout"
        description="Are you sure you want to logout?"
        onClose={handleClose}
        onConfirm={handleSubmit}
        confirmLabel="Logout"
        confirmColor="error"
      />
    </div>
  );
}
