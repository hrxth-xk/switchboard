"use client";

import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { Modal } from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  pending = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal
      className="confirm-dialog"
      closeOnOverlayClick={!pending}
      labelledBy="confirm-dialog-title"
      onClose={pending ? () => {} : onCancel}
      open={open}
    >
      <div className="confirm-dialog-body">
        <h2 className="panel-title" id="confirm-dialog-title">
          {title}
        </h2>
        {description ? <p className="confirm-dialog-description">{description}</p> : null}
      </div>
      <div className="confirm-dialog-actions">
        <button className="button secondary" disabled={pending} onClick={onCancel} type="button">
          {cancelLabel}
        </button>
        <button
          className={`button${destructive ? " danger" : ""}${pending ? " is-pending" : ""}`}
          disabled={pending}
          onClick={onConfirm}
          type="button"
        >
          <ActionButtonContent pending={pending} pendingLabel="Working…">
            {confirmLabel}
          </ActionButtonContent>
        </button>
      </div>
    </Modal>
  );
}
