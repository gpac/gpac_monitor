import { GenericInput } from './GenericInput';

interface BooleanInputProps {
  value?: boolean;
  onChange: (value: boolean | null) => void;
  rules?: { disabled?: boolean };
  argName?: string;
}

export const BooleanInput: React.FC<BooleanInputProps> = ({
  value,
  onChange,
  rules,
  argName,
}) => {

  return (
    <GenericInput
      type="boolean"
      value={value}
      onChange={onChange}
      rules={rules}
      argName={argName}
    />
  );
};
