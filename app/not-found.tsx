// app/not-found.tsx

import { ErrorStatusPage } from "@/components/errors/error-status-page";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <ErrorStatusPage
      statusCode="404"
      title="Page not found"
      description="We couldn't find the page you were looking for. It might have been moved or deleted."
      primaryAction={{ href: "/dashboard", label: "Back to dashboard" }}
      secondaryAction={{ href: "/files", label: "Go to Files" }}
      iconName="search"
      Icon={SearchX}
    />
  );
}
