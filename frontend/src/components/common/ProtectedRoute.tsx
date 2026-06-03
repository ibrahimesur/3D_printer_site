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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push("/");
    }
  }, [isMounted, isAuthenticated, user, allowedRoles, router]);

  if (!isMounted) {
    return null; // Don't render anything while checking auth on client
  }

  // If authenticated but missing roles (caught by useEffect, but prevent render in the meantime)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
