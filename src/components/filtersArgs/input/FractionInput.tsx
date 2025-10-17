import { Input } from '../../ui/input';
import { useState, useEffect } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import type { FilterArgumentInputProps } from '../types';

export const FractionInput: React.FC<FilterArgumentInputProps<'frac'>> = ({
  value,
  onChange,
  rules,
}) => {
  const parseFraction = (
    val: string | number | undefined,
  ): [number, number] => {
    // if no value return [0, 1]
    if (val === undefined || val === null) {
      return [0, 1];
    }

    if (typeof val === 'number') {
      return [val, 1];
    }

    // Parse fraction
    if (typeof val === 'string') {
      const parts = val.split('/');
      if (parts.length === 2) {
        const num = parseInt(parts[0]);
        const den = parseInt(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return [num, den];
        }
      } else if (parts.length === 1) {
        const num = parseInt(parts[0]);
        if (!isNaN(num)) {
          return [num, 1];
        }
      }
    }

    //Echec return [0, 1]
    return [0, 1];
  };

  const [fraction, setFraction] = useState<[number, number]>(
    parseFraction(value),
  );
  const firstRender = useFirstMountState();

  useDebounce(
    () => {
      if (firstRender || `${fraction[0]}/${fraction[1]}` === value) return;

      // Si dénominateur est 0, retourner "0" (comme le collègue)
      if (fraction[1] === 0) {
        onChange('0');
      } else {
        onChange(`${fraction[0]}/${fraction[1]}`);
      }
    },
    1000,
    [fraction],
  );

  useEffect(() => {
    setFraction(parseFraction(value));
  }, [value]);

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        value={fraction[0]}
        onChange={(_e) => {
          const newNum = parseInt(_e.target.value);
          if (!isNaN(newNum)) {
            setFraction([newNum, fraction[1]]);
          }
        }}
        disabled={rules?.disabled}
        className="h-7 w-16 text-xs bg-gray-800/60 border-gray-600/50 hover:bg-gray-700/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
      />
      <span className="text-gray-500 text-xs">/</span>
      <Input
        type="number"
        value={fraction[1]}
        onChange={(_e) => {
          const newDen = parseInt(_e.target.value);
          // Autoriser 0 (sera converti en "0" au debounce)
          if (!isNaN(newDen)) {
            setFraction([fraction[0], newDen]);
          }
        }}
        disabled={rules?.disabled}
        className="h-7 w-16 text-xs bg-gray-800/60 border-gray-600/50 hover:bg-gray-700/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
      />
    </div>
  );
};
