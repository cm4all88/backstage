import { redirect } from "next/navigation";

// Backstagely has no landing page.
// It is a serving domain for exclusive creator content.
// All creator discovery, signup, and account management is on spotlightly.app.
export default function RootPage() {
  redirect("https://spotlightly.app");
}
