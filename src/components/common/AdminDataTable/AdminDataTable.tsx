'use client';

import * as React from 'react';
import {
  Box,
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import DensityMediumRoundedIcon from '@mui/icons-material/DensityMediumRounded';
import DensitySmallRoundedIcon from '@mui/icons-material/DensitySmallRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import FirstPageRoundedIcon from '@mui/icons-material/FirstPageRounded';
import LastPageRoundedIcon from '@mui/icons-material/LastPageRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type { AdminDataTableProps, AdminDataTableDensity } from './types';

// ─── design tokens ──────────────────────────────────────────────────────────
const BORDER = '#E5E7EB';
const BORDER_STRONG = '#D1D5DB';
const ROW_HOVER = '#F9FAFB';
const ROW_SELECTED = 'rgba(0, 33, 165, 0.06)';
const HEADER_BG = '#FAFAFA';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#4B5563';
const TEXT_MUTED = '#6B7280';
const BRAND = '#0021A5';
const FONT_STACK =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ─── helpers ────────────────────────────────────────────────────────────────
function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = headers.map(escape).join(',');
  const body = rows
    .map((r) => headers.map((h) => escape(r[h])).join(','))
    .join('\n');
  return `${head}\n${body}`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadLs<T>(key: string | undefined, fallback: T): T {
  if (!key || typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLs(key: string | undefined, value: unknown) {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

// ─── main component ─────────────────────────────────────────────────────────
export function AdminDataTable<TData>({
  data,
  columns,
  loading = false,
  getRowId,
  title,
  description,
  searchPlaceholder = 'Search…',
  enableSearch = true,
  enableColumnVisibility = true,
  enableDensityToggle = true,
  enableExport = true,
  enableSelection = false,
  rowActions,
  bulkActions,
  toolbarLeft,
  toolbarRight,
  onRowClick,
  emptyState,
  densityDefault = 'comfortable',
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  stickyHeader = true,
  tableId,
  exportFilename = 'table.csv',
  minWidth,
  maxHeight = '70vh',
}: AdminDataTableProps<TData>) {
  // ─── persisted prefs ──────────────────────────────────────────────────────
  const visibilityKey = tableId ? `adt:${tableId}:vis` : undefined;
  const densityKey = tableId ? `adt:${tableId}:den` : undefined;

  // ─── state ────────────────────────────────────────────────────────────────
  const [density, setDensity] = React.useState<AdminDataTableDensity>(() =>
    loadLs<AdminDataTableDensity>(densityKey, densityDefault)
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() =>
      loadLs<VisibilityState>(visibilityKey, {})
    );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  React.useEffect(() => saveLs(densityKey, density), [density, densityKey]);
  React.useEffect(
    () => saveLs(visibilityKey, columnVisibility),
    [columnVisibility, visibilityKey]
  );

  // ─── injected columns (selection + actions) ───────────────────────────────
  const injectedColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    const cols: ColumnDef<TData, any>[] = [];

    if (enableSelection) {
      cols.push({
        id: '__select',
        size: 44,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            size="small"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            sx={{ p: 0.5, color: BORDER_STRONG }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="small"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            sx={{ p: 0.5, color: BORDER_STRONG }}
          />
        ),
      });
    }

    cols.push(...columns);

    if (rowActions) {
      cols.push({
        id: '__actions',
        header: '',
        size: 160,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}
          >
            {rowActions(row.original)}
          </Box>
        ),
      });
    }

    return cols;
  }, [columns, rowActions, enableSelection]);

  const table = useReactTable({
    data,
    columns: injectedColumns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: enableSelection,
    globalFilterFn: 'includesString',
  });

  const rowPaddingY = density === 'comfortable' ? '12px' : '6px';
  const headerPaddingY = density === 'comfortable' ? '10px' : '8px';
  const cellPaddingX = '16px';

  const hasData = data.length > 0;
  const filteredRows = table.getRowModel().rows;
  const noResults = hasData && filteredRows.length === 0;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const clearSelection = () => setRowSelection({});

  // ─── toolbar ──────────────────────────────────────────────────────────────
  const [columnsMenuAnchor, setColumnsMenuAnchor] =
    React.useState<HTMLElement | null>(null);

  const handleExport = () => {
    const visibleLeafCols = table
      .getVisibleLeafColumns()
      .filter((c) => c.id !== '__select' && c.id !== '__actions');
    const headers = visibleLeafCols.map((c) => {
      const raw = c.columnDef.header;
      return typeof raw === 'string' ? raw : c.id;
    });
    const rows = table.getFilteredRowModel().rows.map((row) => {
      const record: Record<string, unknown> = {};
      visibleLeafCols.forEach((col) => {
        const cell = row.getAllCells().find((c) => c.column.id === col.id);
        const v = cell?.getValue();
        const h =
          typeof col.columnDef.header === 'string'
            ? col.columnDef.header
            : col.id;
        if (Array.isArray(v)) record[h] = v.join(', ');
        else if (v instanceof Date) record[h] = v.toISOString();
        else record[h] = v as unknown;
      });
      return record;
    });
    downloadCsv(exportFilename, toCsv(rows, headers));
  };

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes(
          (document.activeElement as HTMLElement | null)?.tagName || ''
        )
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: `1px solid ${BORDER}`,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        fontFamily: FONT_STACK,
        position: 'relative',
      }}
    >
      {/* header / title band */}
      {(title || description) && (
        <Box sx={{ px: 2.5, pt: 2, pb: 1.25 }}>
          {title && (
            <Typography
              sx={{
                fontFamily: FONT_STACK,
                fontSize: 16,
                fontWeight: 600,
                color: TEXT_PRIMARY,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography
              sx={{
                fontFamily: FONT_STACK,
                fontSize: 13,
                color: TEXT_MUTED,
                mt: 0.25,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}

      {/* toolbar */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          borderBottom: `1px solid ${BORDER}`,
          backgroundColor: '#FFFFFF',
        }}
      >
        {enableSearch && (
          <TextField
            inputRef={searchRef}
            size="small"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: TEXT_MUTED, fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: globalFilter ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setGlobalFilter('')}
                    aria-label="Clear search"
                    sx={{ p: 0.25 }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : (
                <InputAdornment position="end">
                  <Box
                    sx={{
                      fontFamily: FONT_STACK,
                      fontSize: 11,
                      color: TEXT_MUTED,
                      px: 0.75,
                      py: 0.25,
                      border: `1px solid ${BORDER}`,
                      borderRadius: '4px',
                      backgroundColor: '#FAFAFA',
                    }}
                  >
                    /
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 280,
              '& .MuiOutlinedInput-root': {
                fontFamily: FONT_STACK,
                fontSize: 13,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                '& fieldset': { borderColor: BORDER },
                '&:hover fieldset': { borderColor: BORDER_STRONG },
                '&.Mui-focused fieldset': {
                  borderColor: BRAND,
                  borderWidth: '1px',
                },
              },
            }}
          />
        )}

        {toolbarLeft}

        <Box sx={{ flex: 1 }} />

        {toolbarRight}

        {enableDensityToggle && (
          <Tooltip
            title={
              density === 'comfortable' ? 'Compact rows' : 'Comfortable rows'
            }
          >
            <IconButton
              size="small"
              onClick={() =>
                setDensity(
                  density === 'comfortable' ? 'compact' : 'comfortable'
                )
              }
              sx={{
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                color: TEXT_SECONDARY,
                '&:hover': { backgroundColor: ROW_HOVER },
              }}
              aria-label="Toggle density"
            >
              {density === 'comfortable' ? (
                <DensityMediumRoundedIcon sx={{ fontSize: 18 }} />
              ) : (
                <DensitySmallRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        )}

        {enableColumnVisibility && (
          <>
            <Tooltip title="Columns">
              <IconButton
                size="small"
                onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}
                sx={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  color: TEXT_SECONDARY,
                  '&:hover': { backgroundColor: ROW_HOVER },
                }}
                aria-label="Column visibility"
              >
                <TuneRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={columnsMenuAnchor}
              open={Boolean(columnsMenuAnchor)}
              onClose={() => setColumnsMenuAnchor(null)}
              PaperProps={{
                sx: {
                  mt: 0.5,
                  borderRadius: '10px',
                  border: `1px solid ${BORDER}`,
                  boxShadow:
                    '0 4px 16px -4px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
                  minWidth: 220,
                  maxHeight: 400,
                },
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: TEXT_MUTED,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontFamily: FONT_STACK,
                }}
              >
                Columns
              </Box>
              <Divider sx={{ borderColor: BORDER }} />
              {table
                .getAllLeafColumns()
                .filter(
                  (c) =>
                    c.getCanHide() &&
                    c.id !== '__select' &&
                    c.id !== '__actions'
                )
                .map((col) => {
                  const rawHeader = col.columnDef.header;
                  const label =
                    typeof rawHeader === 'string' ? rawHeader : col.id;
                  return (
                    <MenuItem
                      key={col.id}
                      onClick={() => col.toggleVisibility()}
                      sx={{ py: 0.5, fontSize: 13, fontFamily: FONT_STACK }}
                    >
                      <ListItemIcon sx={{ minWidth: '28px !important' }}>
                        <Checkbox
                          size="small"
                          checked={col.getIsVisible()}
                          sx={{ p: 0, color: BORDER_STRONG }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                          fontSize: 13,
                          fontFamily: FONT_STACK,
                        }}
                      />
                    </MenuItem>
                  );
                })}
            </Menu>
          </>
        )}

        {enableExport && (
          <Tooltip title="Export CSV">
            <IconButton
              size="small"
              onClick={handleExport}
              sx={{
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                color: TEXT_SECONDARY,
                '&:hover': { backgroundColor: ROW_HOVER },
              }}
              aria-label="Export CSV"
            >
              <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* bulk action bar */}
      {enableSelection && selectedRows.length > 0 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: `1px solid ${BORDER}`,
            backgroundColor: '#F4F6FF',
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT_STACK,
              fontSize: 13,
              color: BRAND,
              fontWeight: 500,
            }}
          >
            {selectedRows.length} selected
          </Typography>
          <Box sx={{ flex: 1 }} />
          {bulkActions && bulkActions(selectedRows, clearSelection)}
          <IconButton
            size="small"
            onClick={clearSelection}
            aria-label="Clear selection"
            sx={{ color: TEXT_SECONDARY }}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* loading bar */}
      {loading && (
        <LinearProgress
          sx={{
            height: 2,
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': { backgroundColor: BRAND },
          }}
        />
      )}

      {/* table */}
      <TableContainer
        sx={{
          maxHeight,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 10, width: 10 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#D1D5DB',
            borderRadius: 8,
          },
          '&::-webkit-scrollbar-track': { backgroundColor: '#F3F4F6' },
        }}
      >
        <Table
          stickyHeader={stickyHeader}
          size="small"
          sx={{
            minWidth: minWidth || 'auto',
            '& th, & td': { fontFamily: FONT_STACK },
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableCell
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                      sx={{
                        backgroundColor: HEADER_BG,
                        color: TEXT_PRIMARY,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        borderBottom: `1px solid ${BORDER}`,
                        py: headerPaddingY,
                        px: cellPaddingX,
                        cursor: canSort ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        '&:hover': canSort
                          ? { backgroundColor: '#F3F4F6' }
                          : undefined,
                      }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box component="span" sx={{ flex: 1 }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </Box>
                        {canSort && (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              color: sorted ? BRAND : TEXT_MUTED,
                              opacity: sorted ? 1 : 0.4,
                            }}
                          >
                            {sorted === 'asc' ? (
                              <ArrowUpwardRoundedIcon sx={{ fontSize: 14 }} />
                            ) : sorted === 'desc' ? (
                              <ArrowDownwardRoundedIcon sx={{ fontSize: 14 }} />
                            ) : (
                              <UnfoldMoreRoundedIcon sx={{ fontSize: 14 }} />
                            )}
                          </Box>
                        )}
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {loading && !hasData
              ? // skeleton rows
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <TableCell
                        key={col.id}
                        sx={{
                          borderBottom: `1px solid ${BORDER}`,
                          py: rowPaddingY,
                          px: cellPaddingX,
                        }}
                      >
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: 13, maxWidth: 160 }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredRows.map((row) => {
                  const selected = row.getIsSelected();
                  return (
                    <TableRow
                      key={row.id}
                      onClick={
                        onRowClick ? () => onRowClick(row.original) : undefined
                      }
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        backgroundColor: selected
                          ? ROW_SELECTED
                          : 'transparent',
                        transition: 'background-color 120ms ease',
                        '&:hover': {
                          backgroundColor: selected ? ROW_SELECTED : ROW_HOVER,
                        },
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          sx={{
                            borderBottom: `1px solid ${BORDER}`,
                            py: rowPaddingY,
                            px: cellPaddingX,
                            fontSize: 13,
                            color: TEXT_SECONDARY,
                            verticalAlign: 'middle',
                            whiteSpace: (cell.column.columnDef.meta as any)
                              ?.wrap
                              ? 'normal'
                              : 'nowrap',
                            maxWidth:
                              (cell.column.columnDef.meta as any)?.maxWidth ||
                              undefined,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>

        {/* empty / no-results states */}
        {!loading && !hasData && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ py: 8, px: 3, color: TEXT_MUTED }}
          >
            {emptyState?.icon ?? (
              <InboxRoundedIcon sx={{ fontSize: 48, color: '#D1D5DB' }} />
            )}
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 500,
                color: TEXT_SECONDARY,
                fontFamily: FONT_STACK,
              }}
            >
              {emptyState?.title ?? 'No data yet'}
            </Typography>
            {emptyState?.description && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: TEXT_MUTED,
                  fontFamily: FONT_STACK,
                  maxWidth: 360,
                  textAlign: 'center',
                }}
              >
                {emptyState.description}
              </Typography>
            )}
            {emptyState?.action}
          </Stack>
        )}

        {!loading && noResults && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ py: 8, px: 3 }}
          >
            <SearchRoundedIcon sx={{ fontSize: 40, color: '#D1D5DB' }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: TEXT_SECONDARY,
                fontFamily: FONT_STACK,
              }}
            >
              No results match your search
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: TEXT_MUTED,
                fontFamily: FONT_STACK,
              }}
            >
              Try a different query or clear the current search.
            </Typography>
          </Stack>
        )}
      </TableContainer>

      {/* pagination */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderTop: `1px solid ${BORDER}`,
          backgroundColor: '#FFFFFF',
          flexWrap: 'wrap',
        }}
      >
        <Typography
          sx={{ fontSize: 12, color: TEXT_MUTED, fontFamily: FONT_STACK }}
        >
          {filteredRows.length === 0
            ? '0 rows'
            : (() => {
                const pi = pagination.pageIndex;
                const ps = pagination.pageSize;
                const total = table.getFilteredRowModel().rows.length;
                const start = pi * ps + 1;
                const end = Math.min((pi + 1) * ps, total);
                return `${start}–${end} of ${total}`;
              })()}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            sx={{ fontSize: 12, color: TEXT_MUTED, fontFamily: FONT_STACK }}
          >
            Rows per page
          </Typography>
          <Select
            size="small"
            value={pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            sx={{
              fontSize: 12,
              fontFamily: FONT_STACK,
              height: 28,
              borderRadius: '6px',
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: BORDER_STRONG },
            }}
          >
            {pageSizeOptions.map((n) => (
              <MenuItem
                key={n}
                value={n}
                sx={{ fontSize: 12, fontFamily: FONT_STACK }}
              >
                {n}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            size="small"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            aria-label="First page"
          >
            <FirstPageRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label="Previous page"
          >
            <KeyboardArrowLeftRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            sx={{
              fontSize: 12,
              color: TEXT_SECONDARY,
              fontFamily: FONT_STACK,
              px: 0.5,
              minWidth: 70,
              textAlign: 'center',
            }}
          >
            Page {pagination.pageIndex + 1} of{' '}
            {Math.max(1, table.getPageCount())}
          </Typography>
          <IconButton
            size="small"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label="Next page"
          >
            <KeyboardArrowRightRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            aria-label="Last page"
          >
            <LastPageRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
}
