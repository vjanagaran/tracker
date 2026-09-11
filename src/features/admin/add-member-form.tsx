"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  createComboboxItems,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addExistingMember } from "./actions";

type Person = { id: string; fullName: string; email: string };

type AddMemberFormProps = {
  boardId: string;
  people: Person[];
};

export function AddMemberForm({ boardId, people }: AddMemberFormProps) {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [role, setRole] = useState("director");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const items = useMemo(
    () =>
      createComboboxItems(people, {
        getValue: (person: Person) => person.id,
        getLabel: (person: Person) => person.fullName || "Unnamed",
      }),
    [people],
  );

  if (people.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Everyone already in the app is on this board, or there is no one to add yet.
      </p>
    );
  }

  async function onSubmit() {
    if (!profileId) {
      setError("Choose a person.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await addExistingMember({ boardId, profileId, role });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setProfileId(null);
    toast.success("Added to the roster.");
    router.refresh();
  }

  return (
    <form
      className="pb-card max-w-md p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Add someone already in the app</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profileId">Person</Label>
          <Combobox
            items={items}
            value={profileId}
            onValueChange={(value) => setProfileId(value)}
            filter={(person: Person, query: string) => {
              const needle = query.trim().toLowerCase();
              if (!needle) {
                return true;
              }
              return (
                person.fullName.toLowerCase().includes(needle) ||
                person.email.toLowerCase().includes(needle)
              );
            }}
          >
            <ComboboxInput id="profileId" placeholder="Search by name or email" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No one matches.</ComboboxEmpty>
              <ComboboxList>
                {(person: Person) => (
                  <ComboboxItem key={person.id} value={person.id}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{person.fullName || "Unnamed"}</span>
                      {person.email ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {person.email}
                        </span>
                      ) : null}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="existingRole">Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value ?? "director")}>
            <SelectTrigger id="existingRole" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="chairman">Chairman</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="min-h-11 px-4" disabled={pending}>
          <Plus className="size-4" aria-hidden="true" />
          {pending ? "Adding to the roster" : "Add to the roster"}
        </Button>
      </div>
    </form>
  );
}
