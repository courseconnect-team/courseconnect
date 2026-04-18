import type { ColumnDef, Row, Table } from '@tanstack/react-table';
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
  initialPageSize?: number;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  tableId?: string;
  exportFilename?: string;
  minWidth?: number | string;
  maxHeight?: number | string;
}

export type AdminColumn<TData> = ColumnDef<TData, any>;
export type AdminRow<TData> = Row<TData>;
export type AdminTable<TData> = Table<TData>;
