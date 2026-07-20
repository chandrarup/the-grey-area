import { redirect } from "next/navigation";

/** Old admin page — hub is now `/`. */
export default function AdminPage() {
  redirect("/");
}
