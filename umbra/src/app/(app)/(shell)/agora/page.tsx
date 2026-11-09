import { redirect } from "next/navigation";

/** El Ágora es ahora uno de los siete foros. */
export default function AgoraPage() {
  redirect("/comunidad/agora");
}
