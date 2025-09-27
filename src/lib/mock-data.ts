import { ExtractedTable } from '@/components/library/excel-details/table-card'
import { ExcelDocument } from './excel-utils'

export function getMockDocument(excelId: string): ExcelDocument {
  return {
    document_id: excelId,
    document_name: 'Sales Data August 2024.xlsx',
    document_type: 'Excel',
    processing_status: 'PROCESSING',
    percentage_completion: 75,
    document_size: 3887436,
    upload_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    sheet_count: 5,
    estimated_tables: 12,
    extracted_tables: 6,
    currently_processing: 1,
    failed_tables: 1,
    user_suggestion: null
  }
}

export function getMockProcessedTables(): ExtractedTable[] {
  return [
    {
      table_id: '1',
      table_name: 'Monthly Sales Summary',
      sheet_name: 'Sales',
      row_count: 150,
      column_count: 12,
      extraction_confidence: 98.5,
      has_headers: true,
      extraction_status: 'extracted',
      data_preview: [
        ['Date', 'Product', 'Region', 'Sales', 'Units', 'Revenue'],
        ['2024-08-01', 'Product A', 'North', '$45,230', '120', '$5,427,600'],
        ['2024-08-02', 'Product B', 'South', '$38,150', '95', '$3,624,250'],
        ['2024-08-03', 'Product C', 'East', '$52,890', '145', '$7,669,050']
      ]
    },
    {
      table_id: '2',
      table_name: 'Regional Performance',
      sheet_name: 'Analytics',
      row_count: 45,
      column_count: 8,
      extraction_confidence: 95.2,
      has_headers: true,
      extraction_status: 'extracted',
      data_preview: [
        ['Region', 'Q1 Sales', 'Q2 Sales', 'Q3 Sales', 'Growth %', 'Target'],
        ['North', '$1.2M', '$1.5M', '$1.8M', '+15%', '$2.0M'],
        ['South', '$980K', '$1.1M', '$1.3M', '+12%', '$1.5M'],
        ['East', '$1.5M', '$1.7M', '$2.1M', '+18%', '$2.3M']
      ]
    },
    {
      table_id: '3',
      table_name: 'Product Inventory',
      sheet_name: 'Inventory',
      row_count: 230,
      column_count: 15,
      extraction_confidence: 99.1,
      has_headers: true,
      extraction_status: 'extracted',
      data_preview: [
        ['SKU', 'Product Name', 'Category', 'Stock', 'Reorder Level', 'Unit Cost'],
        ['SKU-001', 'Widget Pro', 'Electronics', '450', '100', '$45.99'],
        ['SKU-002', 'Gadget Plus', 'Electronics', '320', '75', '$67.50'],
        ['SKU-003', 'Tool Master', 'Hardware', '180', '50', '$123.75']
      ]
    },
    {
      table_id: '4',
      table_name: 'Customer Segments',
      sheet_name: 'Customers',
      row_count: 78,
      column_count: 10,
      extraction_confidence: 92.8,
      has_headers: true,
      extraction_status: 'extracted',
      data_preview: [
        ['Segment', 'Count', 'Avg Purchase', 'Frequency', 'LTV', 'Churn Rate'],
        ['Enterprise', '156', '$12,450', 'Monthly', '$298,800', '2.3%'],
        ['SMB', '892', '$3,250', 'Quarterly', '$39,000', '5.8%'],
        ['Startup', '1,245', '$850', 'Bi-annual', '$5,100', '12.4%']
      ]
    },
    {
      table_id: '5',
      table_name: 'Employee Performance',
      sheet_name: 'HR',
      row_count: 89,
      column_count: 11,
      extraction_confidence: 96.7,
      has_headers: true,
      extraction_status: 'extracted',
      data_preview: [
        ['Employee ID', 'Name', 'Department', 'Performance', 'Rating', 'Bonus %'],
        ['EMP-001', 'John Smith', 'Sales', 'Exceeds', '4.8', '15%'],
        ['EMP-002', 'Jane Doe', 'Marketing', 'Meets', '3.9', '8%'],
        ['EMP-003', 'Bob Johnson', 'Engineering', 'Exceeds', '4.5', '12%']
      ]
    },
    {
      table_id: '6',
      table_name: 'Supply Chain Metrics',
      sheet_name: 'Operations',
      row_count: 67,
      column_count: 13,
      extraction_confidence: 94.3,
      has_headers: true,
      extraction_status: 'extracted',
      data_preview: [
        ['Supplier', 'Lead Time', 'On-Time %', 'Quality Score', 'Cost Index', 'Risk Level'],
        ['Supplier A', '14 days', '98.5%', '4.7/5', '0.92', 'Low'],
        ['Supplier B', '21 days', '92.3%', '4.2/5', '0.88', 'Medium'],
        ['Supplier C', '7 days', '99.1%', '4.9/5', '1.05', 'Low']
      ]
    }
  ]
}

export function getMockCurrentlyProcessingTable(): ExtractedTable {
  return {
    table_id: '7',
    table_name: 'Financial Summary',
    sheet_name: 'Finance',
    row_count: 0,
    column_count: 0,
    extraction_confidence: 0,
    has_headers: false,
    extraction_status: 'pending',
    data_preview: []
  }
}