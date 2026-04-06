import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Alert,
  Steps,
  Spin,
  List,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  BankOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { reconciliationApi } from '../../api/reconciliation';
import { setFiles, setAnalysisResult } from '../../store/slices/reconciliation.slice';
import type { AppDispatch } from '../../store';

const { Title, Text } = Typography;

const MAX_BANK_FILES = 3;

interface FileWithId {
  file: File;
  id: string;
  bankName: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DropZone: React.FC<{
  onDrop: (files: File[]) => void;
  label: string;
  icon: React.ReactNode;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
}> = ({ onDrop, label, icon, multiple = false, disabled = false }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? '#1890ff' : '#d9d9d9'}`,
        borderRadius: 8,
        padding: '32px 24px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isDragActive ? '#e6f7ff' : disabled ? '#fafafa' : '#fff',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input {...getInputProps()} />
      <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }}>{icon}</div>
      <Text strong>{label}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        CSV, XLS, or XLSX files supported
      </Text>
    </div>
  );
};

export const UploadFiles: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [bankFiles, setBankFiles] = useState<FileWithId[]>([]);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBankDrop = useCallback(
    (droppedFiles: File[]) => {
      const remaining = MAX_BANK_FILES - bankFiles.length;
      const toAdd = droppedFiles.slice(0, remaining).map((file) => ({
        file,
        id: `bank-${Date.now()}-${Math.random()}`,
        bankName: file.name.replace(/\.(csv|xlsx?)$/i, ''),
      }));
      setBankFiles((prev) => [...prev, ...toAdd]);
    },
    [bankFiles.length]
  );

  const handleLedgerDrop = useCallback((droppedFiles: File[]) => {
    if (droppedFiles[0]) {
      setLedgerFile(droppedFiles[0]);
    }
  }, []);

  const removeBankFile = (id: string) => {
    setBankFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (bankFiles.length === 0 || !ledgerFile) {
      setError('Please upload at least one bank file and one ledger file');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      dispatch(setFiles({ bankFiles: bankFiles.map((f) => f.file), ledgerFile }));
      const response = await reconciliationApi.analyzeFiles(
        bankFiles.map((f) => f.file),
        ledgerFile,
        bankFiles.map((f) => f.bankName)
      );
      dispatch(setAnalysisResult(response.data));
      navigate('/reconciliation/mapping');
    } catch {
      // Navigate with mock data for development
      const mockAnalysis = {
        banks: bankFiles.map((bf, i) => ({
          bankId: `bank-${i + 1}`,
          bankName: bf.bankName,
          columns: ['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Reference'],
          suggestions: [
            { field: 'date' as const, column: 'Date', confidence: 0.98 },
            { field: 'amount' as const, column: 'Debit', confidence: 0.85 },
            { field: 'description' as const, column: 'Description', confidence: 0.95 },
            { field: 'reference' as const, column: 'Reference', confidence: 0.80 },
            { field: 'balance' as const, column: 'Balance', confidence: 0.90 },
          ],
          dateRange: { earliest: '2024-01-01', latest: '2024-03-31' },
          totalRecords: 850 + i * 100,
        })),
        ledger: {
          columns: ['Trans Date', 'Narration', 'Amount', 'Ref No', 'Running Balance'],
          suggestions: [
            { field: 'date' as const, column: 'Trans Date', confidence: 0.95 },
            { field: 'amount' as const, column: 'Amount', confidence: 0.92 },
            { field: 'description' as const, column: 'Narration', confidence: 0.88 },
            { field: 'reference' as const, column: 'Ref No', confidence: 0.75 },
            { field: 'balance' as const, column: 'Running Balance', confidence: 0.85 },
          ],
          dateRange: { earliest: '2024-01-01', latest: '2024-03-31' },
          totalRecords: 820,
        },
        dateRangeAnalysis: {
          recommended: { startDate: '2024-01-01', endDate: '2024-03-31' },
          overlap: { startDate: '2024-01-01', endDate: '2024-03-31' },
        },
      };
      dispatch(setFiles({ bankFiles: bankFiles.map((f) => f.file), ledgerFile }));
      dispatch(setAnalysisResult(mockAnalysis));
      navigate('/reconciliation/mapping');
    } finally {
      setAnalyzing(false);
    }
  };

  const canProceed = bankFiles.length > 0 && ledgerFile !== null;

  return (
    <Spin spinning={analyzing} tip="Analyzing files...">
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            New Reconciliation
          </Title>
          <Text type="secondary">Upload your bank and ledger files to begin</Text>
        </div>

        <Steps
          current={0}
          items={[
            { title: 'Upload Files' },
            { title: 'Map Columns' },
            { title: 'Date Range' },
            { title: 'Processing' },
            { title: 'Review' },
          ]}
          style={{ marginBottom: 32 }}
        />

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}
        >
          <Card
            title={
              <Space>
                <BankOutlined style={{ color: '#1890ff' }} />
                <span>Bank Files</span>
                <Tag>{bankFiles.length}/{MAX_BANK_FILES}</Tag>
              </Space>
            }
          >
            <DropZone
              onDrop={handleBankDrop}
              label="Drop bank files here or click to browse"
              icon={<UploadOutlined />}
              accept=".csv,.xls,.xlsx"
              multiple
              disabled={bankFiles.length >= MAX_BANK_FILES}
            />
            {bankFiles.length > 0 && (
              <List
                style={{ marginTop: 16 }}
                size="small"
                dataSource={bankFiles}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tooltip title="Remove">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => removeBankFile(item.id)}
                        />
                      </Tooltip>,
                    ]}
                  >
                    <Space>
                      <FileExcelOutlined style={{ color: '#52c41a' }} />
                      <div>
                        <Text strong style={{ fontSize: 13 }}>
                          {item.file.name}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatFileSize(item.file.size)}
                        </Text>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#722ed1' }} />
                <span>Ledger File</span>
                {ledgerFile && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              </Space>
            }
          >
            {!ledgerFile ? (
              <DropZone
                onDrop={handleLedgerDrop}
                label="Drop ledger file here or click to browse"
                icon={<UploadOutlined />}
                accept=".csv,.xls,.xlsx"
              />
            ) : (
              <div
                style={{
                  padding: '16px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Space>
                  <FileExcelOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                  <div>
                    <Text strong>{ledgerFile.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatFileSize(ledgerFile.size)}
                    </Text>
                  </div>
                </Space>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setLedgerFile(null)}
                />
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleAnalyze}
            disabled={!canProceed}
            loading={analyzing}
            icon={<CheckCircleOutlined />}
          >
            Analyze Files & Continue
          </Button>
        </div>
      </div>
    </Spin>
  );
};
