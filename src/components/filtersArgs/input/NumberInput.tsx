import { GenericInput } from './GenericInput';

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

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  rules,
  isPending = false,
}) => {
  return (
    <GenericInput
      type="number"
      value={value}
      onChange={onChange}
      rules={rules}
      isPending={isPending}
    />
  );
};
