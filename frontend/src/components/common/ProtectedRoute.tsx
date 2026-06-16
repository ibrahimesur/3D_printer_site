"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("customer" | "producer" | "admin")[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    useAuthStore.persist.rehydrate();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isMounted || !isHydrated) return;

    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push("/");
    }
  }, [isMounted, isHydrated, isAuthenticated, user, allowedRoles, router]);

  if (!isMounted || !isHydrated) {
    return null; // Don't render anything while checking auth on client
  }

  // If not authenticated, do not render children
  if (!isAuthenticated()) {
    return null;
  }

  // If authenticated but missing roles (caught by useEffect, but prevent render in the meantime)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
