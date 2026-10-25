"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Settings as SettingsIcon,
  Wallet,
  Shield,
  UserPlus,
  Database,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  SettingsSidebar,
  SettingsTabId,
  SettingsTabItem,
  ProfileTab,
  PreferencesTab,
  AccountsTab,
  SecurityTab,
  IdentitiesTab,
  DataArchiveTab,
} from "@/components/settings";

const SETTINGS_TABS: SettingsTabItem[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    subtitle: "Manage your primary account credentials",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: SettingsIcon,
    subtitle: "Configure appearance and system preferences",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    subtitle: "Manage your bank, cash, and card accounts",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    subtitle: "Manage active sessions and security credentials",
  },
  {
    id: "identities",
    label: "Switch Account",
    icon: UserPlus,
    subtitle: "Switch between linked user accounts",
  },
  {
    id: "data",
    label: "Data & Export",
    icon: Database,
    subtitle: "Export and backup your financial data",
  },
];

const VALID_TABS: SettingsTabId[] = [
  "profile",
  "preferences",
  "accounts",
  "security",
  "identities",
  "data",
];

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const searchParams = useSearchParams();
  const { loading: authLoading } = useAuth();

  // Synchronize active tab with URL ?tab= parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as SettingsTabId | null;
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (authLoading) {
    return (
      <PageContainer>
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="flex flex-wrap gap-6 mt-2">
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 h-[500px] space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Account Preferences, Security & Data Management"
      />

      <div className="flex flex-col lg:flex-row items-start gap-6 mt-0">
        {/* Reusable Sidebar Navigation (Desktop list + Mobile select) */}
        <SettingsSidebar
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Dynamic Sub-Page Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "preferences" && <PreferencesTab />}
              {activeTab === "accounts" && <AccountsTab />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "identities" && <IdentitiesTab />}
              {activeTab === "data" && <DataArchiveTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <SettingsPageContent />
    </Suspense>
  );
}
