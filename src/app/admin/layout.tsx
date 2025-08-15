import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <AdminNav />
      <main className="p-4">{children}</main>
    </div>
  );
}
