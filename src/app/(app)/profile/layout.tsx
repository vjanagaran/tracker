import { PageHeader } from "@/components/page-header";
import { ProfileTabs } from "@/features/profile/profile-tabs";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Profile" />
      <ProfileTabs />
      {children}
    </>
  );
}
