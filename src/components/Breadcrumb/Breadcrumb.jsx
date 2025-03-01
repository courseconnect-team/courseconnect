import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter((seg) => seg);

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link underline="hover" color="inherit" href="/dashboard">
        Home
      </Link>
      {pathSegments.slice(0, -1).map((segment) => (
        <Link
          underline="hover"
          color="inherit"
          href={`/${segment}`}
          key={segment}
        >
          {segment.split('%')[0]}
        </Link>
      ))}
      <Typography sx={{ color: 'text.primary' }}>
        {' '}
        {pathSegments.length > 0 &&
          pathSegments[pathSegments.length - 1].split('%')[0]}
      </Typography>
    </Breadcrumbs>
  );
}
