import type { ColumnDef, Row, SortingState, Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';

export type AdminDataTableDensity = 'comfortable' | 'compact';

export interface AdminDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  loading?: boolean;
  error?: unknown;
  getRowId?: (row: TData) => string;

  title?: string;
  description?: string;
  searchPlaceholder?: string;
  searchableKeys?: (keyof TData | string)[];

  enableSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableDensityToggle?: boolean;
  enableExport?: boolean;
  enableSelection?: boolean;

  rowActions?: (row: TData) => ReactNode;
  bulkActions?: (selected: TData[], clearSelection: () => void) => ReactNode;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;

  onRowClick?: (row: TData) => void;

  emptyState?: {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
  };

  densityDefault?: AdminDataTableDensity;
  initialSorting?: SortingState;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  tableId?: string;
  exportFilename?: string;
  /**
   * Replaces the default CSV export, which derives its header from the columns
   * currently visible on screen. Tables whose export has to satisfy a fixed
   * external schema must pass this, so toggling a column can't change the file.
   * Receives the rows surviving the active search/filters, in display order.
   */
  onExport?: (rows: TData[]) => void;
  minWidth?: number | string;
  maxHeight?: number | string;
}

export type AdminColumn<TData> = ColumnDef<TData, any>;
export type AdminRow<TData> = Row<TData>;
export type AdminTable<TData> = Table<TData>;
