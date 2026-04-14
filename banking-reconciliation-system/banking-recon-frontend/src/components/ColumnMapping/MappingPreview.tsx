import React from 'react';
import { Table, Card, Typography, Tag, Space, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DetectedColumn {
  columnName: string;
  sampleValues: string[];
  detectedType: 'date' | 'amount' | 'text' | 'number';
  confidence: number;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

interface MappingPreviewProps {
  detectedColumns: DetectedColumn[];
  mappings: ColumnMapping[];
  maxRows?: number;
}

export const MappingPreview: React.FC<MappingPreviewProps> = ({
  detectedColumns,
  mappings,
  maxRows = 3,
}) => {
  // Create a map of source column to target field
  const mappingMap = new Map(
    mappings.map(m => [m.sourceColumn, m.targetField])
  );

  // Filter only mapped columns
  const mappedColumns = detectedColumns.filter(col =>
    mappingMap.has(col.columnName)
  );

  if (mappedColumns.length === 0) {
    return (
      <Card size="small" title={<Space><EyeOutlined /> Mapping Preview</Space>}>
        <Empty
          description="No mappings configured yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // Create preview table columns
  const tableColumns = mappedColumns.map(col => {
    const targetField = mappingMap.get(col.columnName);
    return {
      title: (
        <Space direction="vertical" size={0}>
          <Text strong>{targetField}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            from: {col.columnName}
          </Text>
        </Space>
      ),
      dataIndex: col.columnName,
      key: col.columnName,
      render: (value: string) => (
        <Text
          style={{
            color: value === '' ? '#d9d9d9' : undefined,
          }}
        >
          {value || '(empty)'}
        </Text>
      ),
    };
  });

  // Create preview table data
  const rowCount = Math.max(
    ...mappedColumns.map(col => col.sampleValues.length)
  );

  const tableData = Array.from({ length: Math.min(rowCount, maxRows) }, (_, rowIndex) => {
    const row: any = { key: rowIndex };
    mappedColumns.forEach(col => {
      row[col.columnName] = col.sampleValues[rowIndex] || '';
    });
    return row;
  });

  return (
    <Card
      size="small"
      title={
        <Space>
          <EyeOutlined />
          <span>Mapping Preview</span>
          <Tag color="blue">Sample Data</Tag>
        </Space>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Preview of how your data will appear after mapping (showing first {maxRows} rows)
        </Text>
      </div>
      <Table
        columns={tableColumns}
        dataSource={tableData}
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default MappingPreview;
