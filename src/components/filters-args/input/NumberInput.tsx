import { GenericInput, type GenericInputValue } from './GenericInput';

interface NumberInputProps {
  value?: number;
  onChange: (value: number | null) => void;
  rules?: {
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
  isPending?: boolean;
}

export const NumberInput = ({
  value,
  onChange,
  rules,
  isPending = false,
}: NumberInputProps) => {
  return (
    <GenericInput
      type="number"
      value={value}
      onChange={onChange as (v: GenericInputValue) => void}
      rules={rules}
      isPending={isPending}
    />
  );
};
