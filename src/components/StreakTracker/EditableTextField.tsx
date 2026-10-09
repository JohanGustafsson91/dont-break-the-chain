import { ChangeEvent, useEffect, useRef, useState } from "react";
import "./EditableTextField.css";

export const EditableTextField = ({
  type,
  value,
  onUpdate,
  placeholder = "",
  allowEmpty = true,
  disabled = false,
  maxLength,
  selectOnMount = false,
}: Props) => {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(
    function selectTextOnMount() {
      if (!selectOnMount) return;
      ref.current?.focus();
      ref.current?.select();
    },
    [selectOnMount],
  );

  const props = {
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setText(e.target.value),
    onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const updatedValue = e.target.value;
      if (updatedValue === value) return;

      return !allowEmpty && !updatedValue
        ? setText(value)
        : onUpdate(updatedValue);
    },
    placeholder,
    disabled,
    maxLength,
    ref,
  };

  return type === "text" ? (
    <input {...props} type="text" value={text} />
  ) : (
    <textarea {...props} value={text} />
  );
};

interface Props {
  type: "text" | "textarea";
  value: string;
  allowEmpty?: boolean;
  placeholder?: string;
  onUpdate: (text: string) => void;
  disabled?: boolean;
  maxLength?: number;
  /** Focus the field and select its text, so typing replaces it. */
  selectOnMount?: boolean;
}
