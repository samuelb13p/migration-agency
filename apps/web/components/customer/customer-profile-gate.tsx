"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken, getSessionUser } from "../../lib/auth";
import { getPendingCustomerContract } from "../../lib/customer-contract";
import { CustomerProfileRecord, isCustomerProfileComplete } from "../../lib/customer-profile";
import { Card } from "../ui/card";

export function CustomerProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">("loading");

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser || sessionUser.roleName !== "customer") {
      setStatus("ready");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus("ready");
      return;
    }

    void apiFetchWithToken<CustomerProfileRecord>("/api/profile", token)
      .then(async (profile) => {
        if (isCustomerProfileComplete(profile)) {
          const pendingContract = await getPendingCustomerContract(token);
          if (pendingContract && pathname !== "/contracts" && pathname !== "/profile") {
            router.replace("/contracts?sign=1");
            setStatus("blocked");
            return;
          }

          setStatus("ready");
          return;
        }

        if (pathname !== "/profile") {
          router.replace("/profile?complete=1");
        }
        setStatus("blocked");
      })
      .catch(() => {
        if (pathname !== "/profile") {
          router.replace("/profile?complete=1");
        }
        setStatus("blocked");
      });
  }, [pathname, router]);

  if (status === "loading") {
    return (
      <Card>
        <p className="text-sm text-slate-500">Checking your profile information...</p>
      </Card>
    );
  }

  if (status === "blocked" && pathname !== "/profile") {
    return (
      <Card>
        <h2 className="text-xl font-semibold">Complete the required onboarding first</h2>
        <p className="mt-3 text-sm text-slate-600">
          We need your full customer information and any pending contract signature before you can continue using the portal.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
