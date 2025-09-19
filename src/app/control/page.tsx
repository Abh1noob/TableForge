"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ActionConfig {
  type: 'edit' | 'delete' | 'custom';
  label: string;
  action: string; // navigation path or function name
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

export default function ControlPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [pageName, setPageName] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [arrayField, setArrayField] = useState("");
  const [actions, setActions] = useState<ActionConfig[]>([]);
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    enableSearch: false,
    filters: [],
    enablePagination: true
  });
  const [step, setStep] = useState(1);

  const parseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedData(parsed);
      
      // Auto-detect array fields
      const arrayFields = findArrayFields(parsed);
      if (arrayFields.length === 1 && arrayFields[0]) {
        setArrayField(arrayFields[0]);
      }
      
      setStep(2);
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  const findArrayFields = (obj: any, path = ""): string[] => {
    const fields: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (Array.isArray(value) && value.length > 0) {
        fields.push(currentPath);
      } else if (typeof value === 'object' && value !== null) {
        fields.push(...findArrayFields(value, currentPath));
      }
    }
    
    return fields;
  };

  const getArrayData = () => {
    if (!parsedData || !arrayField) return [];
    
    const keys = arrayField.split('.');
    let current = parsedData;
    
    for (const key of keys) {
      current = current[key];
      if (!current) return [];
    }
    
    return Array.isArray(current) ? current : [];
  };

  const getAvailableColumns = () => {
    const arrayData = getArrayData();
    if (arrayData.length === 0) return [];
    
    const sampleData = arrayData[0];
    const columns: string[] = [];
    
    const extractColumns = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extractColumns(value, fullKey);
        } else if (!Array.isArray(value)) {
          columns.push(fullKey);
        }
      });
    };
    
    extractColumns(sampleData);
    return columns;
  };

  const getUniqueValuesForColumn = (columnId: string) => {
    const arrayData = getArrayData();
    const values = new Set();
    
    arrayData.forEach(item => {
      const value = getNestedValue(item, columnId);
      if (value !== null && value !== undefined) {
        values.add(value.toString());
      }
    });
    
    return Array.from(values).slice(0, 10); // Limit to 10 unique values
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const addFilter = (columnId: string) => {
    const uniqueValues = getUniqueValuesForColumn(columnId);
    const newFilter: FilterConfig = {
      columnId,
      type: uniqueValues.length <= 10 ? 'select' : 'search',
      options: uniqueValues.length <= 10 ? uniqueValues as string[] : undefined
    };
    
    setTableConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const removeFilter = (index: number) => {
    setTableConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const addAction = (type: ActionConfig['type']) => {
    // Check if action type already exists
    const existingAction = actions.find(action => action.type === type);
    if (existingAction) {
      alert(`${type} action already exists!`);
      return;
    }

    const newAction: ActionConfig = {
      type,
      label: type === 'edit' ? 'Edit' : type === 'delete' ? 'Delete' : 'Custom Action',
      action: type === 'edit' ? '/edit/[id]' : type === 'delete' ? 'handleDelete' : 'handleCustom'
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const generateTable = async () => {
    if (!pageName || !arrayField) return;
    
    const arrayData = getArrayData();
    if (arrayData.length === 0) return;
    
    // Call API to generate files
    const response = await fetch('/api/generate-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageName,
        sampleData: arrayData[0],
        actions,
        arrayField,
        tableConfig
      })
    });
    
    if (response.ok) {
      alert(`Table generated successfully! Check /app/${pageName}`);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Table Generator Control Panel</h1>
      
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Paste Your API Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="json-input">API Response JSON</Label>
              <Textarea
                id="json-input"
                placeholder="Paste your API response here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={10}
                className="font-mono"
              />
            </div>
            <Button onClick={parseJson} disabled={!jsonInput.trim()}>
              Parse JSON
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Configure Your Table</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="page-name">Page Name</Label>
                <Input
                  id="page-name"
                  placeholder="e.g., users, products, orders"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Array Field Path</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={arrayField}
                  onChange={(e) => setArrayField(e.target.value)}
                >
                  <option value="">Select array field...</option>
                  {findArrayFields(parsedData).map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              {arrayField && (
                <div>
                  <Label>Sample Row Data</Label>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(getArrayData()[0], null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Row Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => addAction('edit')}>
                  + Edit Action
                </Button>
                <Button variant="outline" onClick={() => addAction('delete')}>
                  + Delete Action  
                </Button>
                <Button variant="outline" onClick={() => addAction('custom')}>
                  + Custom Action
                </Button>
              </div>
              
              {actions.length > 0 && (
                <div className="space-y-2">
                  <Label>Configured Actions:</Label>
                  {actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary">{action.type}</Badge>
                      <span>{action.label}</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {action.action}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAction(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                onClick={() => setStep(3)}
                disabled={!pageName || !arrayField}
                className="w-full"
              >
                Next: Configure Filters & Search
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Configure Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-search"
                  checked={tableConfig.enableSearch}
                  onCheckedChange={(checked) => 
                    setTableConfig(prev => ({ ...prev, enableSearch: !!checked }))
                  }
                />
                <Label htmlFor="enable-search">Enable Global Search Bar</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-pagination"
                  checked={tableConfig.enablePagination}
                  onCheckedChange={(checked) => 
                    setTableConfig(prev => ({ ...prev, enablePagination: !!checked }))
                  }
                />
                <Label htmlFor="enable-pagination">Enable Pagination</Label>
              </div>

              <div>
                <Label>Column Filters</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Select columns you want to add filters for:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {getAvailableColumns().map(column => (
                    <Button
                      key={column}
                      variant="outline"
                      size="sm"
                      onClick={() => addFilter(column)}
                      disabled={tableConfig.filters.some(f => f.columnId === column)}
                      className="justify-start"
                    >
                      + {column}
                    </Button>
                  ))}
                </div>
              </div>

              {tableConfig.filters.length > 0 && (
                <div>
                  <Label>Configured Filters:</Label>
                  <div className="space-y-2 mt-2">
                    {tableConfig.filters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="secondary">{filter.columnId}</Badge>
                        <span className="text-sm">
                          {filter.type === 'select' ? 'Dropdown' : 'Search'} Filter
                        </span>
                        {filter.options && (
                          <span className="text-xs text-gray-500">
                            ({filter.options.length} options)
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={generateTable}
                  className="flex-1"
                >
                  Generate Table Components
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}