import "./BottomSheet.css";
import { ReactNode, useState } from "react";

export const BottomSheet = ({ onClose, children }: Props) => {
  const [isClosing, setIsClosing] = useState(false);

  function handleClose() {
    // Fields such as the note save on blur. iOS Safari doesn't move focus to the tapped
    // button, and a field that is removed while focused never blurs, so blur it first.
    (document.activeElement as HTMLElement | null)?.blur();
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
