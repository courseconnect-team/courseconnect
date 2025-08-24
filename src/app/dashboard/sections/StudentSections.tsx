/* components/sections/StudentSections.tsx */
import { DashboardCard } from '@/components/DashboardCard/DashboardCard';
import { useFetchStatus } from '@/hooks/useFetchStatus';

type Props = { userId: string };

export function StudentSections({ userId }: Props) {
  const { assignments, loading, error } = useFetchStatus(userId);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Failed to load.</p>;

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Applications</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {assignments.map((card) => (
          <DashboardCard key={card.id} {...card} />
        ))}
      </div>
    </>
  );
}
