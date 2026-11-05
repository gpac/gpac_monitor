declare module 'react-grid-layout/build/utils' {
  import { Layout } from 'react-grid-layout';

  export function compact(
    layout: Layout[],
    compactType: 'vertical' | 'horizontal' | null,
    cols: number,
  ): Layout[];
}
