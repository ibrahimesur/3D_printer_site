import Navbar from "@/components/common/Navbar";
import ProtectedRoute from "@/components/common/ProtectedRoute";

export default function ProducerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <ProtectedRoute allowedRoles={["producer"]}>
        <main className="pt-16">{children}</main>
      </ProtectedRoute>
    </>
  );
}
