import { ApplicationPreview } from '@/newcomponents/ApplicationPreview/ApplicationPreview';
import PageLayout from '@/newcomponents/PageLayout/PageLayout';
export default function ApplicationPage({
  params: { id },
}: {
  params: { id: string };
}) {
  return (
    <PageLayout>
      <ApplicationPreview id={id} layout="page" />;
    </PageLayout>
  );
}
