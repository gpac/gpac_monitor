import { LuFile, LuFileText, LuFilm, LuMusic } from 'react-icons/lu';

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
