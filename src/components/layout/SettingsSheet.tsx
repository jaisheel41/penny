"use client"

import { useState } from "react"
import { Settings } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SettingsForm } from "@/components/settings/SettingsForm"
import { cn } from "@/lib/utils"

export function SettingsSheet({
  email,
  initial,
}: {
  email: string
  initial: {
    name: string
    currency: string
    monthly_income: string
    email_notifications: boolean
  }
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 text-muted-foreground hover:text-foreground"
        )}
      >
        <Settings className="size-4" />
        <span className="hidden sm:inline">Settings</span>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsForm email={email} initial={initial} />
      </DialogContent>
    </Dialog>
  )
}
