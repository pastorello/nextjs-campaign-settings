import { ReactNode } from "react";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import isValidString from "@/app/lib/utils/validators/isValidString";

interface ModalProps {
  isOpen: boolean;
  setIsOpen: Function;
  title: string;
  description?: string;
  children: ReactNode;
  size?: string;
}

const Modal = ({
  isOpen,
  setIsOpen,
  title,
  description,
  children,
  size = "medium",
}: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={() => setIsOpen(false)}
          className={clsx("relative z-50", {
            "w-[900px]": size === "medium",
            "w-[400px]": size === "small",
          })}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
          />
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 w-screen overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 bg-white p-12"
              >
                {isValidString(title) && (
                  <DialogTitle className="text-lg font-bold">
                    {title}
                  </DialogTitle>
                )}
                {isValidString(description) && (
                  <Description>{description}</Description>
                )}
                {children}
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default Modal;
