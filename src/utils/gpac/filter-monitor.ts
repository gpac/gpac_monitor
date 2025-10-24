import { LuFile, LuFileText, LuFilm, LuMusic } from 'react-icons/lu';
import { GraphFilterData } from '../../types/domain/gpac/model';

/**
 * Verify if the data is valid GraphFilterData
 */
export const isValidFilterData = (data: unknown): data is GraphFilterData => {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.idx === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.nb_ipid === 'number' &&
    typeof obj.nb_opid === 'number' &&
    typeof obj.ipid === 'object' &&
    typeof obj.opid === 'object' &&
    obj.ipid !== null &&
    obj.opid !== null
  );
};

// Get icon and label for media type
export const getMediaTypeInfo = (type: string) => {
  switch (type.toLowerCase()) {
    case 'visual':
      return { icon: LuFilm, label: 'Video', color: 'text-debug' };
    case 'audio':
      return { icon: LuMusic, label: 'Audio', color: 'text-info' };
    case 'text':
      return { icon: LuFileText, label: 'Text', color: 'text-warning' };
    case 'file':
      return { icon: LuFile, label: 'File', color: 'text-purple-500' };
    default:
      return { icon: LuFilm, label: type || 'File', color: 'text-gray-500' };
  }
};
