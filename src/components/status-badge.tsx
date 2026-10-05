import { STATUS_TONE } from "@/lib/labels"
import { cn } from "@/lib/utils"

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_TONE[status])}>
      {label}
    </span>
  )
}
