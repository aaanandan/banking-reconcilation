import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Select,
  Space,
  Alert,
  Tag,
  Steps,
  message,
  Spin,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

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

interface BankFileMapping {
  fileName: string;
  bankId: string;
  bankName: string;
  detectedColumns: DetectedColumn[];
  mappings: ColumnMapping[];
  isComplete: boolean;
}

const REQUIRED_FIELDS = [
  { value: 'date', label: 'Date', required: true },
  { value: 'amount', label: 'Amount', required: true },
  { value: 'description', label: 'Description', required: true },
];

const OPTIONAL_FIELDS = [
  { value: 'reference', label: 'Reference Number', required: false },
  { value: 'payee', label: 'Payee/Payer', required: false },
  { value: 'category', label: 'Category', required: false },
  { value: 'balance', label: 'Balance', required: false },
  { value: 'debit', label: 'Debit', required: false },
  { value: 'credit', label: 'Credit', required: false },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export const ColumnMapping: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [bankFileMappings, setBankFileMappings] = useState<BankFileMapping[]>([]);
  const [ledgerMapping, setLedgerMapping] = useState<BankFileMapping | null>(null);
  const [processing, setProcessing] = useState(false);

  // Simulated data - in real implementation, this would come from data-prep-service
  useEffect(() => {
    const initializeMapping = async () => {
      setLoading(true);

      // Simulate API call to data-prep-service for column detection
      setTimeout(() => {
        // Mock detected columns for bank files
        const mockBankFiles: BankFileMapping[] = [
          {
            fileName: 'HDFC_Statement.csv',
            bankId: 'bank_1',
            bankName: 'HDFC Bank',
            detectedColumns: [
              {
                columnName: 'Transaction Date',
                sampleValues: ['2024-01-15', '2024-01-16', '2024-01-17'],
                detectedType: 'date',
                confidence: 0.95,
              },
              {
                columnName: 'Amount',
                sampleValues: ['1500.00', '2300.50', '450.75'],
                detectedType: 'amount',
                confidence: 0.98,
              },
              {
                columnName: 'Description',
                sampleValues: ['Payment to vendor', 'Salary credit', 'Utility bill'],
                detectedType: 'text',
                confidence: 0.92,
              },
              {
                columnName: 'Ref No',
                sampleValues: ['REF123456', 'REF789012', 'REF345678'],
                detectedType: 'text',
                confidence: 0.85,
              },
              {
                columnName: 'Balance',
                sampleValues: ['25000.00', '27300.50', '26849.75'],
                detectedType: 'amount',
                confidence: 0.90,
              },
            ],
            mappings: [
              { sourceColumn: 'Transaction Date', targetField: 'date' },
              { sourceColumn: 'Amount', targetField: 'amount' },
              { sourceColumn: 'Description', targetField: 'description' },
              { sourceColumn: 'Ref No', targetField: 'reference' },
              { sourceColumn: 'Balance', targetField: 'balance' },
            ],
            isComplete: true,
          },
          {
            fileName: 'ICICI_Statement.csv',
            bankId: 'bank_2',
            bankName: 'ICICI Bank',
            detectedColumns: [
              {
                columnName: 'Date',
                sampleValues: ['15-Jan-2024', '16-Jan-2024', '17-Jan-2024'],
                detectedType: 'date',
                confidence: 0.93,
              },
              {
                columnName: 'Debit',
                sampleValues: ['', '2300.50', ''],
                detectedType: 'amount',
                confidence: 0.88,
              },
              {
                columnName: 'Credit',
                sampleValues: ['1500.00', '', '450.75'],
                detectedType: 'amount',
                confidence: 0.88,
              },
              {
                columnName: 'Narration',
                sampleValues: ['Payment received', 'Transfer to savings', 'Bill payment'],
                detectedType: 'text',
                confidence: 0.90,
              },
              {
                columnName: 'Cheque No',
                sampleValues: ['', 'CHQ123', ''],
                detectedType: 'text',
                confidence: 0.75,
              },
            ],
            mappings: [
              { sourceColumn: 'Date', targetField: 'date' },
              { sourceColumn: 'Debit', targetField: 'debit' },
              { sourceColumn: 'Credit', targetField: 'credit' },
              { sourceColumn: 'Narration', targetField: 'description' },
              { sourceColumn: 'Cheque No', targetField: 'reference' },
            ],
            isComplete: true,
          },
        ];

        // Mock detected columns for ledger file
        const mockLedgerFile: BankFileMapping = {
          fileName: 'General_Ledger.csv',
          bankId: 'ledger',
          bankName: 'General Ledger',
          detectedColumns: [
            {
              columnName: 'Entry Date',
              sampleValues: ['2024-01-15', '2024-01-16', '2024-01-17'],
              detectedType: 'date',
              confidence: 0.97,
            },
            {
              columnName: 'Amount',
              sampleValues: ['1500.00', '2300.50', '450.75'],
              detectedType: 'amount',
              confidence: 0.99,
            },
            {
              columnName: 'Particulars',
              sampleValues: ['Cash received', 'Payment made', 'Bank charges'],
              detectedType: 'text',
              confidence: 0.94,
            },
            {
              columnName: 'Voucher No',
              sampleValues: ['V001', 'V002', 'V003'],
              detectedType: 'text',
              confidence: 0.88,
            },
          ],
          mappings: [
            { sourceColumn: 'Entry Date', targetField: 'date' },
            { sourceColumn: 'Amount', targetField: 'amount' },
            { sourceColumn: 'Particulars', targetField: 'description' },
            { sourceColumn: 'Voucher No', targetField: 'reference' },
          ],
          isComplete: true,
        };

        setBankFileMappings(mockBankFiles);
        setLedgerMapping(mockLedgerFile);
        setLoading(false);
        message.success('Column detection completed successfully!');
      }, 1500);
    };

    initializeMapping();
  }, []);

  const handleMappingChange = (
    columnName: string,
    targetField: string,
    isBankFile: boolean,
    fileIndex?: number
  ) => {
    if (isBankFile && fileIndex !== undefined) {
      const updatedMappings = [...bankFileMappings];
      const existingMappingIndex = updatedMappings[fileIndex].mappings.findIndex(
        m => m.sourceColumn === columnName
      );

      if (existingMappingIndex >= 0) {
        updatedMappings[fileIndex].mappings[existingMappingIndex].targetField = targetField;
      } else {
        updatedMappings[fileIndex].mappings.push({ sourceColumn: columnName, targetField });
      }

      // Check if all required fields are mapped
      const requiredFieldsMapped = REQUIRED_FIELDS.every(field =>
        updatedMappings[fileIndex].mappings.some(m => m.targetField === field.value)
      );
      updatedMappings[fileIndex].isComplete = requiredFieldsMapped;

      setBankFileMappings(updatedMappings);
    } else if (ledgerMapping) {
      const updatedMapping = { ...ledgerMapping };
      const existingMappingIndex = updatedMapping.mappings.findIndex(
        m => m.sourceColumn === columnName
      );

      if (existingMappingIndex >= 0) {
        updatedMapping.mappings[existingMappingIndex].targetField = targetField;
      } else {
        updatedMapping.mappings.push({ sourceColumn: columnName, targetField });
      }

      // Check if all required fields are mapped
      const requiredFieldsMapped = REQUIRED_FIELDS.every(field =>
        updatedMapping.mappings.some(m => m.targetField === field.value)
      );
      updatedMapping.isComplete = requiredFieldsMapped;

      setLedgerMapping(updatedMapping);
    }
  };

  const getCurrentMapping = (columnName: string, isBankFile: boolean, fileIndex?: number) => {
    if (isBankFile && fileIndex !== undefined) {
      const mapping = bankFileMappings[fileIndex]?.mappings.find(
        m => m.sourceColumn === columnName
      );
      return mapping?.targetField || '';
    } else if (ledgerMapping) {
      const mapping = ledgerMapping.mappings.find(m => m.sourceColumn === columnName);
      return mapping?.targetField || '';
    }
    return '';
  };

  const getUsedFields = (isBankFile: boolean, fileIndex?: number) => {
    if (isBankFile && fileIndex !== undefined) {
      return bankFileMappings[fileIndex]?.mappings.map(m => m.targetField) || [];
    } else if (ledgerMapping) {
      return ledgerMapping.mappings.map(m => m.targetField) || [];
    }
    return [];
  };

  const handlePrevious = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentFileIndex < bankFileMappings.length) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  const handleStartReconciliation = async () => {
    // Validate all mappings are complete
    const allBankFilesComplete = bankFileMappings.every(file => file.isComplete);
    const ledgerComplete = ledgerMapping?.isComplete || false;

    if (!allBankFilesComplete || !ledgerComplete) {
      message.error('Please complete all required field mappings before proceeding');
      return;
    }

    setProcessing(true);

    // Simulate API call to start reconciliation
    setTimeout(() => {
      message.success('Reconciliation started successfully!');
      setTimeout(() => {
        navigate('/reconciliation/progress');
      }, 1000);
    }, 2000);
  };

  const renderMappingTable = (file: BankFileMapping, isBankFile: boolean, fileIndex?: number) => {
    const usedFields = getUsedFields(isBankFile, fileIndex);

    const columns = [
      {
        title: 'Source Column',
        dataIndex: 'columnName',
        key: 'columnName',
        render: (text: string, record: DetectedColumn) => (
          <Space direction="vertical" size="small">
            <Text strong>{text}</Text>
            <Tag color={record.confidence > 0.9 ? 'green' : 'orange'}>
              Confidence: {(record.confidence * 100).toFixed(0)}%
            </Tag>
          </Space>
        ),
      },
      {
        title: 'Detected Type',
        dataIndex: 'detectedType',
        key: 'detectedType',
        render: (type: string) => (
          <Tag color={type === 'date' ? 'blue' : type === 'amount' ? 'green' : 'default'}>
            {type}
          </Tag>
        ),
      },
      {
        title: 'Sample Values',
        dataIndex: 'sampleValues',
        key: 'sampleValues',
        render: (samples: string[]) => (
          <Space direction="vertical" size="small">
            {samples.slice(0, 2).map((sample, idx) => (
              <Text key={idx} type="secondary" style={{ fontSize: 12 }}>
                {sample}
              </Text>
            ))}
          </Space>
        ),
      },
      {
        title: 'Map to Field',
        key: 'mapping',
        render: (_: any, record: DetectedColumn) => {
          const currentMapping = getCurrentMapping(record.columnName, isBankFile, fileIndex);
          const availableFields = ALL_FIELDS.filter(
            field => !usedFields.includes(field.value) || field.value === currentMapping
          );

          return (
            <Select
              style={{ width: 200 }}
              placeholder="Select field"
              value={currentMapping || undefined}
              onChange={value =>
                handleMappingChange(record.columnName, value, isBankFile, fileIndex)
              }
              allowClear
            >
              <Option value="" disabled>
                -- Select Field --
              </Option>
              {REQUIRED_FIELDS.map(field => (
                <Option
                  key={field.value}
                  value={field.value}
                  disabled={usedFields.includes(field.value) && currentMapping !== field.value}
                >
                  {field.label} {field.required && <Text type="danger">*</Text>}
                </Option>
              ))}
              {OPTIONAL_FIELDS.length > 0 && (
                <Option value="divider" disabled>
                  ── Optional Fields ──
                </Option>
              )}
              {OPTIONAL_FIELDS.map(field => (
                <Option
                  key={field.value}
                  value={field.value}
                  disabled={usedFields.includes(field.value) && currentMapping !== field.value}
                >
                  {field.label}
                </Option>
              ))}
            </Select>
          );
        },
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={file.detectedColumns}
        rowKey="columnName"
        pagination={false}
        size="middle"
      />
    );
  };

  const renderMappingStatus = () => {
    const allFiles = [...bankFileMappings, ...(ledgerMapping ? [ledgerMapping] : [])];
    const completedFiles = allFiles.filter(f => f.isComplete).length;
    const totalFiles = allFiles.length;

    return (
      <Alert
        message={
          completedFiles === totalFiles
            ? 'All files mapped successfully!'
            : `${completedFiles} of ${totalFiles} files mapped`
        }
        description={
          completedFiles === totalFiles
            ? 'All required fields have been mapped. You can proceed to start the reconciliation.'
            : 'Please complete mapping for all required fields (Date, Amount, Description) in each file.'
        }
        type={completedFiles === totalFiles ? 'success' : 'warning'}
        showIcon
        icon={completedFiles === totalFiles ? <CheckCircleOutlined /> : <WarningOutlined />}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Analyzing uploaded files and detecting columns...</Text>
        </div>
      </div>
    );
  }

  const currentFile =
    currentFileIndex < bankFileMappings.length
      ? bankFileMappings[currentFileIndex]
      : ledgerMapping;

  const isBankFile = currentFileIndex < bankFileMappings.length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Column Mapping</Title>
        <Text type="secondary">
          Map the columns from your uploaded files to the expected fields for reconciliation
        </Text>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
          {renderMappingStatus()}
        </Col>
      </Row>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Steps
            current={currentFileIndex}
            items={[
              ...bankFileMappings.map((file, idx) => ({
                title: file.bankName,
                description: file.fileName,
                icon: file.isComplete ? <CheckCircleOutlined /> : <FileTextOutlined />,
                status: file.isComplete ? 'finish' : currentFileIndex === idx ? 'process' : 'wait',
              })),
              {
                title: 'Ledger File',
                description: ledgerMapping?.fileName || '',
                icon: ledgerMapping?.isComplete ? <CheckCircleOutlined /> : <FileTextOutlined />,
                status: ledgerMapping?.isComplete
                  ? 'finish'
                  : currentFileIndex === bankFileMappings.length
                  ? 'process'
                  : 'wait',
              },
            ]}
          />
        </Col>
      </Row>

      {currentFile && (
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span>{currentFile.fileName}</span>
              {currentFile.isComplete && <Tag color="success">Complete</Tag>}
              {!currentFile.isComplete && <Tag color="warning">Incomplete</Tag>}
            </Space>
          }
        >
          <Alert
            message="Required Fields"
            description="Date, Amount, and Description are required fields and must be mapped for each file."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {renderMappingTable(currentFile, isBankFile, currentFileIndex)}
        </Card>
      )}

      <Divider />

      <Card>
        <Space size="middle" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button onClick={() => navigate('/reconciliation/new')} size="large">
              Back to Upload
            </Button>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handlePrevious}
              disabled={currentFileIndex === 0}
              size="large"
            >
              Previous File
            </Button>
          </Space>

          <Space>
            {currentFileIndex < bankFileMappings.length && (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
                size="large"
              >
                Next File
              </Button>
            )}
            {currentFileIndex === bankFileMappings.length && (
              <Button
                type="primary"
                onClick={handleStartReconciliation}
                loading={processing}
                disabled={
                  !bankFileMappings.every(f => f.isComplete) || !ledgerMapping?.isComplete
                }
                size="large"
              >
                Start Reconciliation
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default ColumnMapping;
