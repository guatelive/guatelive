import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#0A0A0A]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
