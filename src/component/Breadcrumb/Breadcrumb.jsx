import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.slice(0, -1).map((segment) => {
    const rawLabel = segment.split('%')[0];
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    return {
      href: `/${segment}`,
      label,
    };
  });

  const lastItem = pathSegments[pathSegments.length - 1].split('%')[0];
  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link underline="hover" color="inherit" href="/dashboard">
        Home
      </Link>
      {breadcrumbs.map((crumb) => (
        <Link
          underline="hover"
          color="inherit"
          href={crumb.href}
          key={crumb.href}
        >
          {crumb.label}
        </Link>
      ))}
      {lastItem && (
        <Typography sx={{ color: 'text.primary' }}>{lastItem}</Typography>
      )}
    </Breadcrumbs>
  );
}
