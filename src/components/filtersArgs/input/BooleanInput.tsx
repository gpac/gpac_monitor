import { GenericInput } from './GenericInput';

interface BooleanInputProps {
  value?: boolean;
  onChange: (value: boolean | null) => void;
  rules?: { disabled?: boolean };
}

export const BooleanInput: React.FC<BooleanInputProps> = ({
  value,
  onChange,
  rules,
}) => {
  return (
    <GenericInput
      type="boolean"
      value={value}
      onChange={onChange}
      rules={rules}
    />
  );
};
