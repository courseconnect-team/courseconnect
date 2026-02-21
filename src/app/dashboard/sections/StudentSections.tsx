/* components/sections/StudentSections.tsx */
import { useFetchStatus } from '@/hooks/useFetchStatus';

type Props = { userId: string };

export function StudentSections({ userId }: Props) {
  const { assignments, loading, error } = useFetchStatus(userId);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Failed to load.</p>;

  return (
    <>
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
    </>
  );
}
