/* components/sections/StaffSections.tsx */
import { useFetchStatus } from '@/hooks/useFetchStatus';

type Props = { userId: string };

export function StaffSections({ userId }: Props) {
  const { courses, assignments, loading, error } = useFetchStatus(userId);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Failed to load.</p>;

  return (
    <>
      {/* Assignments */}
      <h2 className="text-lg font-semibold mb-4">Assignments</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {assignments.map((code) => (
          <div
            key={code}
            className="w-[360px] h-[80px] border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-7 bg-white"
          >
            <span className="text-body1 font-medium text-gray-900">{code}</span>
          </div>
        ))}
      </div>

      {/* Courses */}
      <h2 className="text-lg font-semibold my-4">Courses</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {courses &&
          Object.entries(courses).map(([key, value]) => (
            <div
              key={key}
              className="w-[360px] h-[80px] border border-[#d9d9d9] rounded-xl p-4 flex items-center gap-7 bg-white"
            >
              <span className="text-body1 font-medium text-gray-900">
                {value}
              </span>
            </div>
          ))}
      </div>
    </>
  );
}
