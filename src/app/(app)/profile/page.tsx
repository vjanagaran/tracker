import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { ProfileForm } from "@/features/profile/profile-form";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, photo_url, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Name, photo and number are what people on your board can see."
      />
      {profile?.is_superadmin ? (
        <p className="mb-6 text-sm">
          <Link href="/admin/boards" className="inline-flex items-center gap-1.5 text-primary">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Boards admin
          </Link>
        </p>
      ) : null}
      {!profile ? (
        <div className="mb-6">
          <EmptyState>
            Your profile is not in place yet. Save a name so people on your
            board can see you.
          </EmptyState>
        </div>
      ) : null}
      <ProfileForm
        defaultValues={{
          fullName: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
        }}
        initialPhotoUrl={profile?.photo_url ?? null}
      />
      <form action={signOut} className="mt-8">
        <Button type="submit" variant="outline" className="min-h-11 px-4">
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </form>
    </>
  );
}
