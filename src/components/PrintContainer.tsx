import { forwardRef } from 'react';
import type { ArchiveItem, BatchConfig } from '../types/archive';
import { SheetPreview } from './SheetPreview';

interface PrintContainerProps {
  items: ArchiveItem[];
  config: BatchConfig;
}

export const PrintContainer = forwardRef<HTMLDivElement, PrintContainerProps>(
  ({ items, config }, ref) => {
    // Calcular quantas folhas de 5 etiquetas teremos
    const totalSheets = Math.ceil(items.length / 5) || 1;
    const sheetIndices = Array.from({ length: totalSheets }, (_, i) => i);

    return (
      <div
        ref={ref}
        id="print-sheets-root"
        className="hidden print:block print:w-[297mm] print:m-0 print:p-0"
      >
        {sheetIndices.map((sheetIndex) => (
          <div
            key={`print-sheet-${sheetIndex}`}
            className="sheet-page-wrapper print:w-[297mm] print:h-[210mm] print:overflow-hidden print:page-break-after-always"
            style={{
              pageBreakAfter: 'always',
              breakAfter: 'page',
            }}
          >
            <SheetPreview
              items={items}
              config={config}
              sheetIndex={sheetIndex}
            />
          </div>
        ))}
      </div>
    );
  }
);

PrintContainer.displayName = 'PrintContainer';
