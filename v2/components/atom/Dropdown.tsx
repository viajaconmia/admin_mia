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
      {open && <Modal onClose={handleClose}>{children}</Modal>}
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
