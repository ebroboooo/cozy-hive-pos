
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookCopy,
  Package,
  LogOut,
  Settings,
} from "lucide-react";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/firebase";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslation } from "@/context/settings-provider";
import { useUserProfileContext } from "@/context/user-profile-provider";

const allMenuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'cashier'],
  },
  {
    href: "/summary",
    label: "Summary",
    icon: BookCopy,
    roles: ['admin'],
  },
  {
    href: "/items",
    label: "Items",
    icon: Package,
    roles: ['admin', 'cashier'],
  },
];

export function Nav() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const { t } = useTranslation();
  const { profile, loading } = useUserProfileContext();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const userRole = profile?.role?.toLowerCase();

  const menuItems = allMenuItems.filter(item => 
    !loading && userRole && item.roles.includes(userRole)
  );

  const canSeeSettings = !loading && userRole && ['admin', 'cashier'].includes(userRole);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-2xl">☕</span>
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold font-headline">Cozy-Hive POS</h2>
                <p className="text-sm text-muted-foreground">{t('Co-working Space')}</p>
              </div>
            )}
          </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuButton>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                    {isOpen && <div className="h-4 w-24 bg-muted rounded animate-pulse" />}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={t(item.label as any)}
              >
                <Link href={item.href}>
                  <item.icon />
                  {isOpen && <span>{t(item.label as any)}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {canSeeSettings && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('Settings')} isActive={pathname.startsWith('/settings')}>
                <Link href="/settings">
                  <Settings />
                  {isOpen && <span>{t('Settings')}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={handleSignOut}
              tooltip={t('Sign Out')}
            >
              <LogOut />
              {isOpen && <span>{t('Sign Out')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
