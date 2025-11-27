import React, { createContext, useContext, useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

interface AccordionContextType {
  expandedItems: Set<string>;
  toggleExpanded: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: React.ReactNode;
  defaultExpanded?: string[];
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  defaultExpanded = [],
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded),
  );

  const toggleExpanded = (value: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleExpanded }}>
      <div className="space-y-2">{children}</div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  value: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  value,
}) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const { expandedItems, toggleExpanded } = context;
  const isExpanded = expandedItems.has(value);

  return (
    <div className="rounded-lg">
      <button
        onClick={() => toggleExpanded(value)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-ui transition-colors"
      >
        {title}
        <LuChevronDown
          className={`w-3 h-3 transition-transform duration-200 ease-out ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? 'max-h-96 opacity-100 pt-1' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pb-2">{children}</div>
      </div>
    </div>
  );
};
