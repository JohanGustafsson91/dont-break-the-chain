import { ChangeEvent, useState } from "react";
import "./EditableTextField.css";

export const EditableTextField = ({
  type,
  value,
  onUpdate,
  placeholder = "",
  allowEmpty = true,
  disabled = false,
}: Props) => {
  const [text, setText] = useState(value);

  const props = {
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setText(e.target.value),
    onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const updatedValue = e.target.value;

      return !allowEmpty && !updatedValue
        ? setText(value)
        : onUpdate(updatedValue);
    },
    placeholder: disabled ? "" : placeholder,
    disabled,
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
}
