"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EntrySheet } from "@/components/quick-add/EntrySheet";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="fab" type="button" aria-label="Quick add" onClick={() => setOpen(true)}>
        <Plus size={22} />
      </button>

      <EntrySheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
