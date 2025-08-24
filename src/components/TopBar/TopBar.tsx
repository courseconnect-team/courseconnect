import { useUserInfo } from '@/hooks/User/useGetUserInfo';
import { AppBar } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import { EceLogoPng } from '@/component/EceLogoPng/EceLogoPng';
import Link from 'next/link';
import { Role, roleMapping } from '@/types/User';

export default function TopNav({}) {
  const [user, role, loading, error] = useUserInfo();

  const onNotifications = () => {};
  const display = (v: unknown, fallback = 'Not listed'): string => {
    if (v == null) return fallback; // null/undefined
    if (typeof v === 'string') {
      const t = v.trim();
      return t.length ? t : fallback; // empty string
    }
    if (typeof v === 'number') {
      return Number.isFinite(v) ? String(v) : fallback; // NaN / Infinity
    }
    return String(v);
  };
  return (
    <AppBar
      position="fixed"
      elevation={0}
      className="!bg-[#2d0f83] !h-14 top-0 left-0 right-0 !z-20"
    >
      <Toolbar className="!min-h-0 !px-2 md:!px-5 flex justify-between items-center">
        {/* Brand (left) */}
        <div className="flex items-center flex-shrink-0 h-14 ">
          <Link href="/dashboard" className="flex items-center ">
            <EceLogoPng className="h-4 w-auto" />
          </Link>
        </div>
        {/* User avatar + meta */}
        <div className="!text-[#FFFFFF] flex items-center gap-3">
          {/* Notifications */}
          <IconButton onClick={onNotifications} className="!text-[#FFFFFF]">
            {/* <Badge color="error" overlap="circular" variant="dot"> */}
            <NotificationsNoneOutlinedIcon fontSize="medium" />
            {/* </Badge> */}
          </IconButton>

          {/* User avatar + meta */}
          <Link href="/Profile" className="flex items-center gap-2">
            {/* Circle avatar placeholder (letter) */}
            <div className="w-9 h-9 rounded-full bg-opacity-20 flex items-center justify-center">
              <AccountCircleTwoToneIcon className="text-white" />
            </div>
            <div className="text-left text-white leading-tight hidden sm:block">
              <p className="text-sm">{display(user.displayName)}</p>
              <p className="text-[10px] -mt-0.5 opacity-80">
                {' '}
                {display(roleMapping[role as Role])}
              </p>
            </div>
          </Link>
        </div>
      </Toolbar>
    </AppBar>
  );
}
