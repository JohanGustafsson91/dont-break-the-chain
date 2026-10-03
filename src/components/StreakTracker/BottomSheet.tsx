import "./BottomSheet.css";
import { ReactNode, useState } from "react";

export const BottomSheet = ({ onClose, children }: Props) => {
  const [isClosing, setIsClosing] = useState(false);

  function handleClose() {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }

  return (
    <>
      <div
        className={`BottomSheet-backdrop ${isClosing ? "hidden" : ""}`}
        onClick={handleClose}
      />
      <div className={`BottomSheet ${isClosing ? "hidden" : ""}`}>
        {children(handleClose)}
      </div>
    </>
  );
};

interface Props {
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}
