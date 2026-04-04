"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsSheet } from "@/components/layout/SettingsSheet"
import { cn } from "@/lib/utils"

const mobileNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manage", label: "Manage", icon: FolderKanban },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/manage": "Manage",
}

interface HeaderProps {
  email: string
  profileSettings: {
    name: string
    currency: string
    monthly_income: string
    email_notifications: boolean
  }
}

export function Header({ email, profileSettings }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] ?? ""

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 w-9 p-0"
              )}
            >
              <Menu className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {mobileNav.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={href}
                  className={cn(
                    "gap-2.5",
                    pathname === href && "font-semibold"
                  )}
                  onClick={() => router.push(href)}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h2 className="text-sm font-medium text-muted-foreground md:text-base">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-1">
        <SettingsSheet email={email} initial={profileSettings} />
        <a
          href="/auth/signout"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 text-muted-foreground hover:text-foreground"
          )}
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </a>
      </div>
    </header>
  )
}
