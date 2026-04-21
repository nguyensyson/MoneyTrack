import { AdminNavigation } from '@/components/admin-navigation';
import { AuthGuard } from '@/components/auth-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAdmin>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <AdminNavigation />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
