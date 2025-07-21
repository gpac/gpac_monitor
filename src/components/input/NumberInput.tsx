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
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  rules,
}) => {
  return (
    <GenericInput
      type="number"
      value={value}
      onChange={onChange}
      rules={rules}
    />
  );
};
