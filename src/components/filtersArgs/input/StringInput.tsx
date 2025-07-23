import { GenericInput } from './GenericInput';
import type { FilterArgumentInputProps } from '../types';

export const StringInput: React.FC<FilterArgumentInputProps<'str'>> = ({
  value,
  onChange,
  rules,
}) => {
  return (
    <GenericInput
      type="string"
      value={value}
      onChange={onChange}
      rules={rules}
      debounce
    />
  );
};
