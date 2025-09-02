import { useRef } from 'react';

interface RenderCountProps {
  componentName: string;
}

export const RenderCount = ({ componentName }: RenderCountProps) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`${componentName} rendered ${renderCount.current} times`);

  return null;
};
