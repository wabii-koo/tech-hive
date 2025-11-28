// app/(errors)/unauthorized/page.tsx

import { ErrorStatusPage } from "@/components/errors/error-status-page";
import { LockKeyhole } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <ErrorStatusPage
      statusCode="401"
      title="Unauthorized"
      description={
        <>
          You need to be signed in to view this page. <br />
          Please authenticate and try again.
        </>
      }
      primaryAction={{ href: "/sign-in", label: "Go to sign in" }}
      secondaryAction={{ href: "/", label: "Back to home" }}
      Icon={LockKeyhole}
    />
  );
}
