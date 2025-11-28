// app/(errors)/server-error/page.tsx

import { AlertTriangle } from "lucide-react";
import { ErrorStatusPage } from "@/components/errors/error-status-page";

export default function ServerErrorPage() {
  return (
    <ErrorStatusPage
      statusCode="500"
      title="Something went wrong"
      description={
        <>
          An unexpected error occurred while processing your request. <br />
          Please try again in a moment.
        </>
      }
      primaryAction={{ href: "/", label: "Back to dashboard" }}
      secondaryAction={{ href: "/support", label: "Contact support" }}
      Icon={AlertTriangle}
    />
  );
}
