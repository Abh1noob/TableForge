import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ActionConfig {
  type: 'edit' | 'delete' | 'custom';
  label: string;
  action: string;
}

interface FilterConfig {
  columnId: string;
  type: 'select' | 'search';
  options?: string[];
}

interface TableConfig {
  enableSearch: boolean;
  filters: FilterConfig[];
  enablePagination: boolean;
}

interface GenerateRequest {
  pageName: string;
  sampleData: any;
  actions: ActionConfig[];
  arrayField: string;
  tableConfig?: TableConfig;
}

export async function POST(request: NextRequest) {
  try {
    const { pageName, sampleData, actions, arrayField, tableConfig }: GenerateRequest = await request.json();
    
    // Create directory structure
    const pageDir = path.join(process.cwd(), 'src', 'app', pageName);
    
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }
    
    // Generate files
    await generatePageFile(pageDir, pageName, arrayField, tableConfig);
    await generateColumnsFile(pageDir, sampleData, actions, pageName);
    await generateTableFile(pageDir, pageName, tableConfig);
    await generateSchemaFile(pageDir, sampleData, pageName);
    
    // Generate toolbar if filters or search are enabled
    if (tableConfig && (tableConfig.enableSearch || tableConfig.filters.length > 0)) {
      await generateToolbarFile(pageDir, pageName, tableConfig);
    }
    
    // Generate pagination if enabled
    if (tableConfig?.enablePagination) {
      await generatePaginationFile(pageDir, pageName);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate files' }, { status: 500 });
  }
}

async function generatePageFile(pageDir: string, pageName: string, arrayField: string, tableConfig?: TableConfig) {
  const hasFiltersOrSearch = tableConfig && (tableConfig.enableSearch || tableConfig.filters.length > 0);
  const hasPagination = tableConfig?.enablePagination;
  
  const pageContent = `"use client";

import { useState, useEffect } from "react";
import { ${capitalize(pageName)}Table } from "./${pageName}-table";
import { ${capitalize(pageName)} } from "./${pageName}-schema";
${hasFiltersOrSearch ? `import { ${capitalize(pageName)}Toolbar } from "./${pageName}-toolbar";` : ''}

// API call with pagination, filtering, and search support
async function fetch${capitalize(pageName)}(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, string>;
} = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set('type', '${pageName}');
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  
  // Add filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        searchParams.set(key, value);
      }
    });
  }
  
  const response = await fetch(\`/api/mock-data?\${searchParams.toString()}\`);
  const data = await response.json();
  
  return data;
}

export default function ${capitalize(pageName)}Page() {
  const [data, setData] = useState<${capitalize(pageName)}[]>([]);
  const [loading, setLoading] = useState(true);
  ${hasPagination ? `const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });` : ''}
  ${hasFiltersOrSearch ? `const [searchQuery, setSearchQuery] = useState('');` : ''}
  ${hasFiltersOrSearch ? `const [filters, setFilters] = useState<Record<string, string>>({});` : ''}

  const loadData = async (params?: {
    page?: number;
    search?: string;
    filters?: Record<string, string>;
  }) => {
    setLoading(true);
    try {
      const result = await fetch${capitalize(pageName)}({
        ${hasPagination ? 'page: params?.page || pagination.page,' : ''}
        ${hasPagination ? 'limit: pagination.limit,' : ''}
        ${hasFiltersOrSearch ? 'search: params?.search || searchQuery,' : ''}
        ${hasFiltersOrSearch ? 'filters: params?.filters || filters' : ''}
      });
      
      setData(result.data || []);
      ${hasPagination ? `setPagination(prev => ({ ...prev, ...result.pagination }));` : ''}
    } catch (error) {
      console.error('Error fetching ${pageName}:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  ${hasFiltersOrSearch ? `
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadData({ search: query, filters });
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    loadData({ search: searchQuery, filters: newFilters });
  };` : ''}

  ${hasPagination ? `
  const handlePageChange = (page: number) => {
    loadData({ page });
  };` : ''}

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">${capitalize(pageName)}</h1>
      ${hasFiltersOrSearch ? `
      <${capitalize(pageName)}Toolbar 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        filters={filters}
      />` : ''}
      <${capitalize(pageName)}Table 
        data={data} 
        loading={loading}
        ${hasPagination ? `pagination={pagination}` : ''}
        ${hasPagination ? `onPageChange={handlePageChange}` : ''}
      />
    </div>
  );
}`;

  fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageContent);
}

async function generateColumnsFile(pageDir: string, sampleData: any, actions: ActionConfig[], pageName: string) {
  const fields = Object.keys(sampleData);
  
  const columnDefs = fields.map(field => {
    const isId = field.toLowerCase().includes('id');
    const value = sampleData[field];
    const isArray = Array.isArray(value);
    const isObject = typeof value === 'object' && value !== null && !isArray;
    
    let cellRenderer = `{row.getValue("${field}")}`;
    
    if (isArray) {
      cellRenderer = `{(() => {
        const ${field} = row.getValue("${field}") as any[];
        return Array.isArray(${field}) ? \`\${${field}.length} items\` : 'No items';
      })()}`;
    } else if (isObject) {
      cellRenderer = `{(() => {
        const ${field} = row.getValue("${field}");
        return ${field} ? String(${field}) : 'None';
      })()}`;
    }
    
    return `  {
    accessorKey: "${field}",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="${capitalize(field)}" />
    ),
    cell: ({ row }) => <div${isId ? ' className="w-[80px]"' : ''}>${cellRenderer}</div>,
    ${isId ? 'enableSorting: false,\n    enableHiding: false,' : ''}
  }`;
  }).join(',\n');

  const actionsColumn = actions.length > 0 ? `,
  {
    id: "actions",
    cell: ({ row }) => <${capitalize(pageName)}RowActions row={row.original} />
  }` : '';

  const columnsContent = `"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { type ${capitalize(pageName)} } from "./${pageName}-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
${actions.length > 0 ? `import { ${capitalize(pageName)}RowActions } from "./${pageName}-row-actions";` : ''}

export const ${pageName}Columns: ColumnDef<${capitalize(pageName)}>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
${columnDefs}${actionsColumn}
];`;

  fs.writeFileSync(path.join(pageDir, `${pageName}-columns.tsx`), columnsContent);

  // Generate row actions if needed
  if (actions.length > 0) {
    await generateRowActionsFile(pageDir, actions, pageName);
  }
}

async function generateRowActionsFile(pageDir: string, actions: ActionConfig[], pageName: string) {
  const actionItems = actions.map(action => {
    if (action.type === 'edit') {
      return `        <DropdownMenuItem onClick={() => router.push('${action.action.replace('[id]', `\${row.id}`)}')}>\n          Edit\n        </DropdownMenuItem>`;
    } else if (action.type === 'delete') {
      return `        <DropdownMenuItem onClick={() => handleDelete(row.id)}>\n          Delete\n        </DropdownMenuItem>`;
    } else {
      return `        <DropdownMenuItem onClick={() => console.log('Custom action', row)}>\n          ${action.label}\n        </DropdownMenuItem>`;
    }
  }).join('\n');

  const rowActionsContent = `"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ${capitalize(pageName)} } from "./${pageName}-schema";

interface ${capitalize(pageName)}RowActionsProps {
  row: ${capitalize(pageName)};
}

export function ${capitalize(pageName)}RowActions({ row }: ${capitalize(pageName)}RowActionsProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      // Replace with your delete API call
      console.log('Deleting:', id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
${actionItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`;

  fs.writeFileSync(path.join(pageDir, `${pageName}-row-actions.tsx`), rowActionsContent);
}

async function generateTableFile(pageDir: string, pageName: string, tableConfig?: TableConfig) {
  const hasPagination = tableConfig?.enablePagination;
  
  const tableContent = `"use client";

import { DataTable } from "@/components/table/data-table";
import { ${pageName}Columns } from "./${pageName}-columns";
import { type ${capitalize(pageName)} } from "./${pageName}-schema";
${hasPagination ? `import { Button } from "@/components/ui/button";` : ''}

interface ${capitalize(pageName)}TableProps {
  data: ${capitalize(pageName)}[];
  loading?: boolean;
  ${hasPagination ? `pagination?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; };` : ''}
  ${hasPagination ? `onPageChange?: (page: number) => void;` : ''}
}

export function ${capitalize(pageName)}Table({ 
  data, 
  loading = false,
  ${hasPagination ? `pagination,` : ''}
  ${hasPagination ? `onPageChange` : ''}
}: ${capitalize(pageName)}TableProps) {
  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={${pageName}Columns}
        data={data}
      />
      ${hasPagination ? `
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {data.length} of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}` : ''}
    </div>
  );
}`;

  fs.writeFileSync(path.join(pageDir, `${pageName}-table.tsx`), tableContent);
}

async function generateSchemaFile(pageDir: string, sampleData: any, pageName: string) {
  const fields = Object.keys(sampleData);
  const zodFields = fields.map(field => {
    const value = sampleData[field];
    const type = typeof value === 'string' ? 'z.string()' : 
                 typeof value === 'number' ? 'z.number()' : 
                 typeof value === 'boolean' ? 'z.boolean()' : 
                 'z.any()';
    return `  ${field}: ${type}`;
  }).join(',\n');

  const schemaContent = `import { z } from "zod";

export const ${pageName}Schema = z.object({
${zodFields}
});

export type ${capitalize(pageName)} = z.infer<typeof ${pageName}Schema>;`;

  fs.writeFileSync(path.join(pageDir, `${pageName}-schema.ts`), schemaContent);
}

async function generateToolbarFile(pageDir: string, pageName: string, tableConfig: TableConfig) {
  const toolbarContent = `"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ${capitalize(pageName)}ToolbarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  searchQuery: string;
  filters: Record<string, string>;
}

export function ${capitalize(pageName)}Toolbar({
  onSearch,
  onFilterChange,
  searchQuery,
  filters
}: ${capitalize(pageName)}ToolbarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleFilterChange = (columnId: string, value: string) => {
    const newFilters = { ...filters, [columnId]: value };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
    setLocalSearchQuery('');
    onSearch('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          ${tableConfig.enableSearch ? `
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <Input
              placeholder="Search..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button type="submit" variant="outline">Search</Button>
          </form>` : ''}
          
          ${tableConfig.filters.length > 0 ? `
          <div className="flex items-center space-x-2">
            ${tableConfig.filters.map(filter => {
              if (filter.type === 'select' && filter.options) {
                return `
            <Select
              value={filters['${filter.columnId}'] || 'all'}
              onValueChange={(value) => handleFilterChange('${filter.columnId}', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter ${filter.columnId}" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ${filter.columnId}</SelectItem>
                ${filter.options.map(option => `
                <SelectItem value="${option}">${option}</SelectItem>`).join('')}
              </SelectContent>
            </Select>`;
              }
              return '';
            }).join('')}
          </div>` : ''}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <>
              <Badge variant="secondary">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}`;

  fs.writeFileSync(path.join(pageDir, `${pageName}-toolbar.tsx`), toolbarContent);
}

async function generatePaginationFile(pageDir: string, pageName: string) {
  // Pagination is now integrated into the table component
  // This function is kept for future custom pagination component if needed
  return;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}