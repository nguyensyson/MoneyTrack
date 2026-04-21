import { Navigation } from '@/components/navigation';
import { FloatingActionButton } from '@/components/floating-action-button';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
      <FloatingActionButton />
    </>
  );
}
