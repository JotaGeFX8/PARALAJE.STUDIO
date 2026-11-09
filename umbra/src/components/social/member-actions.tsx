"use client";

import { useTransition, useState } from "react";
import { blockMemberAction, unblockMemberAction } from "@/app/(app)/actions/social";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ReportButton } from "@/components/moderation/report-button";
import { IconBlock } from "@/components/ui/icons";

/** Bloquear / desbloquear y denunciar un perfil. */
export function MemberSafetyActions({ otherId, blocked }: { otherId: string; blocked: boolean }) {
  const [isBlocked, setBlocked] = useState(blocked);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {isBlocked ? (
        <button
          type="button"
          disabled={pending}
          className="icon-btn"
          onClick={() =>
            start(async () => {
              const r = await unblockMemberAction(otherId);
              if (r.ok) setBlocked(false);
            })
          }
        >
          <IconBlock size={16} /> Desbloquear
        </button>
      ) : (
        <ConfirmButton
          confirmLabel="Bloquear: no podrá contactarte"
          onConfirm={async () => {
            const r = await blockMemberAction(otherId);
            if (r.ok) setBlocked(true);
            return r;
          }}
        >
          <IconBlock size={16} /> Bloquear
        </ConfirmButton>
      )}
      <ReportButton targetType="profile" targetId={otherId} label="Denunciar perfil" />
    </div>
  );
}
