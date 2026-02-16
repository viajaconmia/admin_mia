import { useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import Button from "@/components/atom/Button";
import Modal from "@/components/organism/Modal";

type DropdownProps = {
  label?: string;
  children: React.ReactNode;
  onClose?: () => void;
};

export const Dropdown = ({
  label = "Filtros",
  children,
  onClose,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {open && (
        <Modal onClose={handleClose}>
          <>
            {children}
            <div className="w-full flex justify-end mt-4">
              <Button onClick={handleClose} variant="secondary" size="sm">
                Cerrar
              </Button>
            </div>
          </>
        </Modal>
      )}
      <Button
        onClick={() => setOpen((prev) => !prev)}
        icon={!open ? ChevronDown : ChevronUp}
        className="w-full"
        variant="secondary"
      >
        {label}
      </Button>
    </>
  );
};
