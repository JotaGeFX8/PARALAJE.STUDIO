import { redirect } from "next/navigation";

/** Los territorios son ahora subcategorías de los foros. */
export default function TerritoriosAdminPage() {
  redirect("/admin/foros");
}
