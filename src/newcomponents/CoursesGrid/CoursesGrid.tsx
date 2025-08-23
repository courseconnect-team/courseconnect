// components/CoursesGrid.tsx
import CircularProgress from '@mui/material/CircularProgress';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { DashboardCard } from '@/newcomponents/DashboardCard/DashboardCard';
import { SemesterName } from '@/hooks/useSemesterOptions';
type Props = {
  courses: [string, string, string][]; // [id, code, title]
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  showSkeletons: boolean;
  skeletonCount: number;
  semester?: SemesterName[];
  path: string;
};

export function CoursesGrid({
  courses,
  isLoading,
  isFetching,
  error,
  showSkeletons,
  skeletonCount,
  semester,
  path
}: Props) {
  
  return (
    <>
      
        {isFetching && !isLoading && (
          <span className="inline-flex items-center gap-2 ml-2 text-xs text-muted-foreground">
            <CircularProgress size={12} />
            Updating…
          </span>
        )}

      <div className="flex flex-wrap gap-6 mt-4">
        {showSkeletons &&
          Array.from({ length: skeletonCount }).map((_, i) => (
            <DashboardCard.Skeleton key={i} />
          ))}

        {!isLoading && Boolean(error) && (
          <p className="text-sm text-red-600">
            Failed to load courses for {semester}. Try again.
          </p>
        )}

        {!isLoading && !error && courses.length === 0 && semester && semester.length !== 0 &&(
          <p className="text-sm text-muted-foreground">
            No courses for {semester}.
          </p>
        )}

        {!isLoading &&
          !error &&
          courses.map(([id, code, title]) => (
            <DashboardCard
              key={id}
              icon={MenuBookIcon}
              label={code}
              subLabel={title}
              to={`/${path}/${encodeURIComponent(id)}`}
            />
          ))}
      </div>
    </>
  );
}
