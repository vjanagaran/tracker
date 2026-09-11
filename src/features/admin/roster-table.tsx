"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel } from "@/features/boards/labels";
import { updateMember } from "./actions";
import type { AdminMember } from "./types";

export function RosterTable({
  boardId,
  members: initialMembers,
}: {
  boardId: string;
  members: AdminMember[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function save(
    member: AdminMember,
    changes: Partial<Pick<AdminMember, "role" | "status">>,
  ) {
    const previous = member;
    const next = { ...member, ...changes };
    setMembers((current) => current.map((row) => (row.id === member.id ? next : row)));
    setPendingId(member.id);
    setError(null);
    const result = await updateMember({
      membershipId: member.id,
      boardId,
      role: next.role,
      status: next.status,
    });
    setPendingId(null);
    if ("error" in result) {
      setMembers((current) => current.map((row) => (row.id === member.id ? previous : row)));
      setError(result.error);
      return;
    }
    toast.success("Roster updated.");
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No one is on this board yet. Invite by email to add the first member.
      </p>
    );
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <div className="pb-card hidden overflow-hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-3">Name</th>
              <th className="w-[160px] px-3 py-3">Role</th>
              <th className="w-[140px] px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-3 text-sm">{member.fullName || "Unnamed"}</td>
                <td className="px-3 py-3">
                  <Select
                    value={member.role}
                    disabled={pendingId === member.id}
                    onValueChange={(value) => {
                      if (value) {
                        void save(member, { role: value });
                      }
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={`Role for ${member.fullName || "member"}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="chairman">Chairman</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-3">
                  <Select
                    value={member.status}
                    disabled={pendingId === member.id}
                    onValueChange={(value) => {
                      if (value) {
                        void save(member, { status: value });
                      }
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={`Status for ${member.fullName || "member"}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="pb-card divide-y divide-border overflow-hidden md:hidden">
        {members.map((member) => (
          <li key={member.id} className="px-4 py-4">
            <p className="mb-2 text-sm font-medium">
              {member.fullName || "Unnamed"} · {roleLabel(member.role)}
            </p>
            <div className="flex flex-col gap-2">
              <Select
                value={member.role}
                disabled={pendingId === member.id}
                onValueChange={(value) => {
                  if (value) {
                    void save(member, { role: value });
                  }
                }}
              >
                <SelectTrigger className="w-full" aria-label={`Role for ${member.fullName || "member"}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">Director</SelectItem>
                  <SelectItem value="chairman">Chairman</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={member.status}
                disabled={pendingId === member.id}
                onValueChange={(value) => {
                  if (value) {
                    void save(member, { status: value });
                  }
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-label={`Status for ${member.fullName || "member"}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
