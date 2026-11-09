"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deletePostAction, setFollowAction, setSavedAction } from "@/app/(app)/actions/posts";
import { ShareButton } from "@/components/ui/share-button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ReportButton } from "@/components/moderation/report-button";
import { IconBell, IconBookmark, IconEdit, IconTrash } from "@/components/ui/icons";

export function PostActions({
  postId,
  title,
  saved: initialSaved,
  following: initialFollowing,
  canEdit,
  canDelete,
  canReport,
}: {
  postId: string;
  title: string;
  saved: boolean;
  following: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [following, setFollowing] = useState(initialFollowing);
  const [, start] = useTransition();

  function toggleSaved() {
    const next = !saved;
    setSaved(next);
    start(async () => {
      const r = await setSavedAction(postId, next);
      if (!r.ok) setSaved(!next);
    });
  }
  function toggleFollow() {
    const next = !following;
    setFollowing(next);
    start(async () => {
      const r = await setFollowAction(postId, next);
      if (!r.ok) setFollowing(!next);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button type="button" className="icon-btn" aria-pressed={saved} onClick={toggleSaved}>
        <IconBookmark size={17} fill={saved ? "currentColor" : "none"} />
        {saved ? "Guardada" : "Guardar"}
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-pressed={following}
        onClick={toggleFollow}
        title="Recibe avisos de nuevos comentarios"
      >
        <IconBell size={17} />
        {following ? "Siguiendo" : "Seguir"}
      </button>
      <ShareButton path={`/p/${postId}`} title={title} />
      {canEdit && (
        <Link href={`/p/${postId}/editar`} className="icon-btn">
          <IconEdit size={17} /> Editar
        </Link>
      )}
      {canDelete && (
        <ConfirmButton onConfirm={() => deletePostAction(postId)} confirmLabel="Eliminar definitivamente">
          <IconTrash size={17} /> Eliminar
        </ConfirmButton>
      )}
      {canReport && <ReportButton targetType="post" targetId={postId} />}
    </div>
  );
}
