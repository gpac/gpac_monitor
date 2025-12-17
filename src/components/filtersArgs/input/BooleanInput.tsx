import { GenericInput } from './GenericInput';

interface BooleanInputProps {
  value?: boolean;
  onChange: (value: boolean | null) => void;
  rules?: { disabled?: boolean };
  argName?: string;
  isPending?: boolean;
}

export const BooleanInput = ({
  value,
  onChange,
  rules,
  argName,
  isPending = false,
}: BooleanInputProps) => {
  return (
    <GenericInput
      type="boolean"
      value={value}
      onChange={onChange}
      rules={rules}
      argName={argName}
      isPending={isPending}
    />
  );
};
