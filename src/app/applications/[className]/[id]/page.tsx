import { ApplicationPreview } from '@/components/ApplicationPreview/ApplicationPreview';
import PageLayout from '@/components/PageLayout/PageLayout';
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
