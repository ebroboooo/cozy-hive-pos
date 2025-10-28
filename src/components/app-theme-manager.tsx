
'use client';

import { useSettings } from "@/context/settings-provider";
import { useEffect } from "react";

export function AppThemeManager({ 
    children,
}: { 
    children: React.ReactNode
}) {
  const { settings } = useSettings();
  const isArabic = settings.enableArabic;
  const theme = settings.theme;

  useEffect(() => {
    const doc = document.documentElement;

    // Language and Direction
    doc.lang = isArabic ? 'ar' : 'en';
    doc.dir = isArabic ? 'rtl' : 'ltr';

    // Theme
    doc.classList.remove('dark', 'theme-white', 'theme-dark');
    
    if (theme === 'dark') {
      doc.classList.add('dark', 'theme-dark');
    } else {
      doc.classList.add(`theme-${theme}`);
    }
  }, [isArabic, theme]);

  return <>{children}</>;
}
