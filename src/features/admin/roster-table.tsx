"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabel } from "@/features/boards/labels";
import { removeMember, updateMember } from "./actions";
import { resendInvite } from "./invite-actions";
import type { AdminMember } from "./types";

function InvitationStatus({
  member,
  pending,
  onResend,
}: {
  member: AdminMember;
  pending: boolean;
  onResend: (member: AdminMember) => void;
}) {
  if (member.inviteAccepted) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="warn" dot>
        Invited, not yet accepted
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-11 px-2 text-primary sm:min-h-7"
        disabled={pending}
        onClick={() => onResend(member)}
      >
        {pending ? "Resending" : "Resend invite"}
      </Button>
    </div>
  );
}

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
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminMember | null>(null);

  async function resend(member: AdminMember) {
    setResendingId(member.id);
    setError(null);
    const result = await resendInvite({ boardId, membershipId: member.id });
    setResendingId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.success(result.message);
  }

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

  async function confirmRemove() {
    if (!removeTarget) {
      return;
    }
    const member = removeTarget;
    setRemoveTarget(null);
    setPendingId(member.id);
    setError(null);
    const result = await removeMember({
      membershipId: member.id,
      boardId,
    });
    setPendingId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMembers((current) => current.filter((row) => row.id !== member.id));
    toast.success("Removed from the board.");
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
              <th className="px-3 py-3">Invitation</th>
              <th className="w-[100px] px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
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
                <td className="px-3 py-3">
                  <InvitationStatus
                    member={member}
                    pending={resendingId === member.id}
                    onResend={(target) => void resend(target)}
                  />
                </td>
                <td className="px-3 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 px-2 text-destructive sm:min-h-7"
                    disabled={pendingId === member.id}
                    onClick={() => setRemoveTarget(member)}
                  >
                    Remove
                  </Button>
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
              <InvitationStatus
                member={member}
                pending={resendingId === member.id}
                onResend={(target) => void resend(target)}
              />
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 justify-start px-2 text-destructive"
                disabled={pendingId === member.id}
                onClick={() => setRemoveTarget(member)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removeTarget?.fullName || "this member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              They leave this board. Their wheels, plans and tasks stay with them
              and they can be added again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendingId === removeTarget?.id}
              onClick={() => void confirmRemove()}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
