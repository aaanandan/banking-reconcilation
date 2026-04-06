/**
 * Step 111-120: Column Mapping Screen
 *
 * This screen allows users to map columns from their uploaded bank and ledger files
 * to the required system fields. AI-powered suggestions are pre-filled based on
 * analysis performed in the previous step (UploadFiles).
 *
 * Required fields: date, amount, description
 * Optional fields: reference, balance
 *
 * Flow: UploadFiles → ColumnMapping → DateRange → Processing → Review
 */

import { useState } from 'react';
import {
  Card,
  Select,
  Typography,
  Button,
  Steps,
  Table,
  Tag,
  Alert,
  Space,
  Tooltip,
  Badge,
  Divider,
  Progress,
} from 'antd';
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  BankOutlined,
  FileTextOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateBankMapping, updateLedgerMapping, goToStep } from '../../store/slices/reconciliation.slice';
import type { RootState, AppDispatch } from '../../store';
import type { ColumnMapping as ColumnMappingType, ColumnSuggestion } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

// Required fields that must be mapped
const REQUIRED_FIELDS: (keyof ColumnMappingType)[] = ['date', 'amount', 'description'];
const OPTIONAL_FIELDS: (keyof ColumnMappingType)[] = ['reference', 'balance'];

const FIELD_LABELS: Record<keyof ColumnMappingType, string> = {
  date: 'Transaction Date',
  amount: 'Amount',
  description: 'Description / Narration',
  reference: 'Reference Number',
  balance: 'Running Balance',
};

const FIELD_DESCRIPTIONS: Record<keyof ColumnMappingType, string> = {
  date: 'The date the transaction occurred (e.g., 2024-01-15)',
  amount: 'Transaction amount — positive for credits, negative for debits',
  description: 'Transaction description or narration text',
  reference: 'Unique transaction reference or ID number',
  balance: 'Account balance after the transaction',
};

interface MappingRowData {
  field: keyof ColumnMappingType;
  label: string;
  required: boolean;
  currentValue: string;
  suggestion?: ColumnSuggestion;
}

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);
  return (
    <Tooltip title={`AI confidence: ${pct}%`}>
      <Tag icon={<StarOutlined />} color={pct >= 90 ? 'success' : pct >= 70 ? 'warning' : 'error'}>
        {pct}%
      </Tag>
    </Tooltip>
  );
};

interface FileMappingCardProps {
  title: string;
  icon: React.ReactNode;
  columns: string[];
  mapping: ColumnMappingType;
  suggestions: ColumnSuggestion[];
  bankId?: string;
  onChange: (field: keyof ColumnMappingType, value: string) => void;
  isValid: boolean;
}

const FileMappingCard: React.FC<FileMappingCardProps> = ({
  title,
  icon,
  columns,
  mapping,
  suggestions,
  onChange,
  isValid,
}) => {
  const allFields: (keyof ColumnMappingType)[] = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

  const rows: MappingRowData[] = allFields.map((field) => ({
    field,
    label: FIELD_LABELS[field],
    required: REQUIRED_FIELDS.includes(field),
    currentValue: mapping[field] || '',
    suggestion: suggestions.find((s) => s.field === field),
  }));

  const requiredMapped = REQUIRED_FIELDS.filter((f) => mapping[f]).length;
  const completionPct = Math.round((requiredMapped / REQUIRED_FIELDS.length) * 100);

  const tableColumns = [
    {
      title: 'System Field',
      dataIndex: 'field',
      key: 'field',
      width: 200,
      render: (_: unknown, record: MappingRowData) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong style={{ fontSize: 13 }}>
              {record.label}
            </Text>
            {record.required && <Tag color="red" style={{ fontSize: 10 }}>Required</Tag>}
          </Space>
          <Tooltip title={FIELD_DESCRIPTIONS[record.field]}>
            <Text type="secondary" style={{ fontSize: 11, cursor: 'help' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              {FIELD_DESCRIPTIONS[record.field].slice(0, 45)}...
            </Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'AI Suggestion',
      dataIndex: 'suggestion',
      key: 'suggestion',
      width: 160,
      render: (_: unknown, record: MappingRowData) =>
        record.suggestion ? (
          <Space>
            <Text code style={{ fontSize: 12 }}>
              {record.suggestion.column}
            </Text>
            <ConfidenceBadge confidence={record.suggestion.confidence} />
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            No suggestion
          </Text>
        ),
    },
    {
      title: 'Mapped To',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (_: unknown, record: MappingRowData) => (
        <Select
          value={record.currentValue || undefined}
          placeholder={record.required ? 'Select column (required)' : 'Select column (optional)'}
          onChange={(value) => onChange(record.field, value || '')}
          style={{ width: '100%', minWidth: 200 }}
          allowClear
          status={record.required && !record.currentValue ? 'error' : undefined}
          showSearch
          optionFilterProp="children"
        >
          {columns.map((col) => (
            <Option key={col} value={col}>
              <Space>
                <Text style={{ fontSize: 13 }}>{col}</Text>
                {record.suggestion?.column === col && (
                  <Tag color="blue" style={{ fontSize: 10 }}>
                    AI Pick
                  </Tag>
                )}
              </Space>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 80,
      render: (_: unknown, record: MappingRowData) => {
        if (record.currentValue) {
          return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
        }
        if (record.required) {
          return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
        }
        return <Text type="secondary">—</Text>;
      },
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {icon}
            <span>{title}</span>
            {isValid ? (
              <Badge status="success" text="Ready" />
            ) : (
              <Badge status="error" text="Incomplete" />
            )}
          </Space>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Required fields:
            </Text>
            <Progress
              type="circle"
              percent={completionPct}
              size={36}
              status={completionPct === 100 ? 'success' : 'normal'}
            />
          </Space>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <Alert
        message="Map your file columns to the system fields below. AI suggestions have been pre-filled — review and adjust as needed."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Table
        dataSource={rows}
        columns={tableColumns}
        rowKey="field"
        pagination={false}
        size="middle"
        rowClassName={(record) => (record.required && !record.currentValue ? 'error-row' : '')}
      />
    </Card>
  );
};

// Preview panel showing a summary of all mappings
const MappingSummary: React.FC<{
  bankMappings: Array<{ bankId: string; bankName: string; columnMapping: ColumnMappingType }>;
  ledgerMapping: ColumnMappingType;
}> = ({ bankMappings, ledgerMapping }) => {
  return (
    <Card title="Mapping Summary" size="small">
      {bankMappings.map((bm) => (
        <div key={bm.bankId} style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
            <BankOutlined style={{ marginRight: 4 }} />
            {bm.bankName}
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {Object.entries(bm.columnMapping)
              .filter(([, v]) => v)
              .map(([field, col]) => (
                <Tag key={field} style={{ fontSize: 11 }}>
                  {FIELD_LABELS[field as keyof ColumnMappingType]} → <Text code>{col}</Text>
                </Tag>
              ))}
          </div>
        </div>
      ))}
      <Divider style={{ margin: '8px 0' }} />
      <div>
        <Text strong style={{ fontSize: 12, color: '#722ed1' }}>
          <FileTextOutlined style={{ marginRight: 4 }} />
          Ledger
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {Object.entries(ledgerMapping)
            .filter(([, v]) => v)
            .map(([field, col]) => (
              <Tag key={field} style={{ fontSize: 11 }}>
                {FIELD_LABELS[field as keyof ColumnMappingType]} → <Text code>{col}</Text>
              </Tag>
            ))}
        </div>
      </div>
    </Card>
  );
};

export const ColumnMapping: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { analysisResult, bankMappings, ledgerMapping } = useSelector(
    (state: RootState) => state.reconciliation
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!analysisResult) {
    navigate('/reconciliation/new');
    return null;
  }

  const handleBankMappingChange = (
    bankId: string,
    field: keyof ColumnMappingType,
    value: string
  ) => {
    dispatch(updateBankMapping({ bankId, mapping: { [field]: value } }));
  };

  const handleLedgerMappingChange = (field: keyof ColumnMappingType, value: string) => {
    dispatch(updateLedgerMapping({ [field]: value }));
  };

  const isBankMappingValid = (mapping: ColumnMappingType): boolean =>
    REQUIRED_FIELDS.every((f) => !!mapping[f]);

  const isLedgerMappingValid = (): boolean =>
    ledgerMapping ? REQUIRED_FIELDS.every((f) => !!ledgerMapping[f]) : false;

  const allMappingsValid =
    bankMappings.every((bm) => isBankMappingValid(bm.columnMapping)) && isLedgerMappingValid();

  const handleBack = () => {
    navigate('/reconciliation/new');
  };

  const handleContinue = () => {
    if (!allMappingsValid) {
      setValidationError(
        'Please map all required fields (Date, Amount, Description) for all files before continuing.'
      );
      return;
    }
    setValidationError(null);
    dispatch(goToStep('daterange'));
    navigate('/reconciliation/date-range');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Column Mapping
        </Title>
        <Text type="secondary">
          Map each file's columns to the required system fields. AI has pre-suggested mappings
          based on column names — please review and correct as needed.
        </Text>
      </div>

      <Steps
        current={1}
        items={[
          { title: 'Upload Files', status: 'finish' },
          { title: 'Map Columns', status: 'process' },
          { title: 'Date Range' },
          { title: 'Processing' },
          { title: 'Review' },
        ]}
        style={{ marginBottom: 32 }}
      />

      {validationError && (
        <Alert
          message={validationError}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
          onClose={() => setValidationError(null)}
        />
      )}

      {/* Bank file mappings */}
      {bankMappings.map((bm) => {
        const bankAnalysis = analysisResult.banks.find((b) => b.bankId === bm.bankId);
        if (!bankAnalysis) return null;
        return (
          <FileMappingCard
            key={bm.bankId}
            title={`Bank File: ${bm.bankName}`}
            icon={<BankOutlined style={{ color: '#1890ff' }} />}
            columns={bankAnalysis.columns}
            mapping={bm.columnMapping}
            suggestions={bankAnalysis.suggestions}
            bankId={bm.bankId}
            onChange={(field, value) => handleBankMappingChange(bm.bankId, field, value)}
            isValid={isBankMappingValid(bm.columnMapping)}
          />
        );
      })}

      {/* Ledger mapping */}
      {ledgerMapping && (
        <FileMappingCard
          title="Ledger File"
          icon={<FileTextOutlined style={{ color: '#722ed1' }} />}
          columns={analysisResult.ledger.columns}
          mapping={ledgerMapping}
          suggestions={analysisResult.ledger.suggestions}
          onChange={(field, value) => handleLedgerMappingChange(field, value)}
          isValid={isLedgerMappingValid()}
        />
      )}

      {/* Summary panel */}
      <MappingSummary bankMappings={bankMappings} ledgerMapping={ledgerMapping || { date: '', amount: '', description: '' }} />

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} size="large">
          Back to Upload
        </Button>
        <Space>
          {!allMappingsValid && (
            <Text type="danger" style={{ fontSize: 13 }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              Required fields missing
            </Text>
          )}
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleContinue}
            disabled={!allMappingsValid}
            size="large"
          >
            Continue to Date Range
          </Button>
        </Space>
      </div>
    </div>
  );
};
