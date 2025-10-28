
import { ReactElement } from 'react';
import { Nav } from '@/components/app/nav';
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AuthGuard } from './auth-guard';
import { UserProfileProvider } from '@/context/user-profile-provider';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <UserProfileProvider>
        <SidebarProvider>
          <div className="flex h-screen bg-background">
            <Sidebar>
                <Nav />
            </Sidebar>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="mb-4">
                  <SidebarTrigger />
                </div>
                {children as ReactElement}
            </main>
          </div>
        </SidebarProvider>
      </UserProfileProvider>
    </AuthGuard>
  );
}
