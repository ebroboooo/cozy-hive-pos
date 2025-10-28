
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 1 week
const SIDEBAR_WIDTH_EXPANDED = "16rem"
const SIDEBAR_WIDTH_COLLAPSED = "3rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const KEYBOARD_SHORTCUT = "b"

type SidebarContextType = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isMobile: boolean
  toggle: () => void
  state: "expanded" | "collapsed"
}

const SidebarContext = React.createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  storageKey?: string
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  storageKey = SIDEBAR_COOKIE_NAME,
}: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [isMounted, setIsMounted] = React.useState(false)
  const [openMobile, setOpenMobile] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    try {
      const storedValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${storageKey}=`))
        ?.split("=")[1]

      if (storedValue) {
        setIsOpen(storedValue === "true")
      }
    } catch (e) {
      console.error("Failed to read sidebar state from cookie.", e)
    }
  }, [storageKey])

  const setAndStoreOpen = React.useCallback(
    (value: boolean) => {
      setIsOpen(value)
      try {
        document.cookie = `${storageKey}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      } catch (e) {
        console.error("Failed to save sidebar state to cookie.", e)
      }
    },
    [storageKey]
  )

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setAndStoreOpen(!isOpen)
    }
  }, [isMobile, isOpen, setAndStoreOpen])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggle])

  const effectiveIsOpen = isMobile ? openMobile : isOpen
  const effectiveSetIsOpen = isMobile ? setOpenMobile : setAndStoreOpen

  const contextValue = React.useMemo(
    () => ({
      isOpen: effectiveIsOpen,
      setIsOpen: effectiveSetIsOpen,
      isMobile,
      toggle,
      state: isOpen ? "expanded" : ("collapsed" as "expanded" | "collapsed"),
    }),
    [effectiveIsOpen, effectiveSetIsOpen, isMobile, toggle, isOpen]
  )
  
  if (!isMounted) {
     return null;
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  )
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "left" | "right"
  }
>(({ className, children, side = "left" }, ref) => {
  const { isOpen, isMobile, setIsOpen, state } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={side}
          className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground"
          style={{ "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        >
          <div className="flex h-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      ref={ref}
      data-state={state}
      className={cn(
        "hidden md:flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] shrink-0",
        side === "left" ? "border-r" : "border-l",
        className
      )}
      style={{
        width: isOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
      }}
    >
      {children}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggle } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={toggle}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2 p-2", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 p-2 mt-auto", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"


export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"


const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "border border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    { asChild = false, isActive = false, variant = "default", tooltip, className, children, ...props },
    ref
  ) => {
    const { isOpen } = useSidebar()
    const Comp = asChild ? Slot : "button"

    const button = (
       <Comp
        ref={ref}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant }), "justify-start", className)}
        {...props}
      >
        {children}
      </Comp>
    )

    if (tooltip && !isOpen) {
      const tooltipContent = typeof tooltip === "string" ? { children: tooltip } : tooltip
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" align="center" {...tooltipContent} />
        </Tooltip>
      )
    }

    return button
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Separator as SidebarSeparator,
  Input as SidebarInput,
  Skeleton as SidebarMenuSkeleton
};
