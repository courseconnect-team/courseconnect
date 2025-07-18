import React from 'react';
import Link from 'next/link';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import handleSignOut from '@/firebase/auth/auth_signout';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
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
              className={`
              group relative flex flex-col items-center text-5xl px-2 py-1 duration-200
              ${isActive ? 'bg-white text-[#6C37D8]' : 'text-white '}
                hover:border-r-4 "rounded-sm border-black]
            `}
            >
              <Icon fontSize="inherit" className="!text-[#FFFFFF] " />
              <span className="!text-[#FFFFFF] text-[12px] mt-1 tracking-wide text-center">
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* bottom logout */}
      <button
        onClick={handleSubmit}
        className="!text-[#FFFFFF] cursor-pointer flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity duration-200"
      >
        <LogoutOutlinedIcon className="text-white text-5xl" />
        <span className="text-white text-[13px] mt-1 tracking-wide">
          Logout
        </span>
      </button>
      <Dialog
        style={{
          borderImage:
            'linear-gradient(to bottom, rgb(9, 251, 211), rgb(255, 111, 241)) 1',
          boxShadow: '0px 2px 20px 4px #00000040',
          borderRadius: '20px',
          border: '2px solid',
        }}
        PaperProps={{
          style: { borderRadius: 20 },
        }}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle
          style={{
            fontFamily: 'SF Pro Display-Medium, Helvetica',
            textAlign: 'center',
            fontSize: '40px',
            fontWeight: '540',
          }}
        >
          Logout
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText
              style={{
                marginTop: '35px',
                fontFamily: 'SF Pro Display-Medium, Helvetica',
                textAlign: 'center',
                fontSize: '24px',
                color: 'black',
              }}
            >
              Are you sure you want to logout?
            </DialogContentText>
          </DialogContent>
          <DialogActions
            style={{
              marginTop: '30px',
              marginBottom: '42px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '15%',
            }}
          >
            <Button
              variant="outlined"
              style={{
                fontSize: '17px',
                marginLeft: 'auto',
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                borderColor: '#5736ac',
                color: '#5736ac',
                borderWidth: '3px',
              }}
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              style={{
                fontSize: '17px',
                marginRight: 'auto',
                borderRadius: '10px',
                height: '43px',
                width: '120px',
                textTransform: 'none',
                fontFamily: 'SF Pro Display-Bold , Helvetica',
                backgroundColor: '#5736ac',
                color: '#ffffff',
              }}
              type="submit"
            >
              Logout
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
