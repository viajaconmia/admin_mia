"use client";
import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Clases del contenedor con scroll interno. Default conserva el alto
   * fijo de siempre (`max-h-[630px]`) — pásala solo cuando el contenido
   * necesite más alto (ej. un formulario largo). */
  bodyClassName?: string;
}

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName = "max-h-[630px] overflow-y-auto pr-1",
}: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className={bodyClassName}>{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};
