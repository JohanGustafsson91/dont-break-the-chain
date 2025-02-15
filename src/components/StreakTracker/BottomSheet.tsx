import "./BottomSheet.css";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

export const BottomSheet = ({ onClose, children }: Props) => {
  const [isClosing, setIsClosing] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => handleClose());

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
      <div className={`BottomSheet ${isClosing ? "hidden" : ""}`} ref={ref}>
        {children}
      </div>
    </>
  );
};

function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [callback]);

  return ref;
}

type Props = PropsWithChildren<{
  onClose: () => void;
}>;
