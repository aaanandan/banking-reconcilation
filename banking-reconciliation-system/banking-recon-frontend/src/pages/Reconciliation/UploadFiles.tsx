import React, { useState } from 'react';
import { Card, Typography, Button, List, Space, Alert, message } from 'antd';
import { useDropzone } from 'react-dropzone';
import {
  InboxOutlined,
  FileTextOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface UploadedFile {
  file: File;
  id: string;
}

export const UploadFiles: React.FC = () => {
  const navigate = useNavigate();
  const [bankFiles, setBankFiles] = useState<UploadedFile[]>([]);
  const [ledgerFile, setLedgerFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const acceptedFileTypes = {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  };

  const onDropBankFiles = (acceptedFiles: File[]) => {
    if (bankFiles.length + acceptedFiles.length > 3) {
      message.warning('You can upload a maximum of 3 bank statement files');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
    }));

    setBankFiles([...bankFiles, ...newFiles]);
    message.success(`${acceptedFiles.length} bank file(s) added`);
  };

  const onDropLedgerFile = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setLedgerFile({
        file: acceptedFiles[0],
        id: `${Date.now()}-${Math.random()}`,
      });
      message.success('Ledger file added');
    }
  };

  const removeBankFile = (id: string) => {
    setBankFiles(bankFiles.filter(f => f.id !== id));
    message.info('Bank file removed');
  };

  const removeLedgerFile = () => {
    setLedgerFile(null);
    message.info('Ledger file removed');
  };

  const handleStartProcessing = async () => {
    if (bankFiles.length === 0) {
      message.error('Please upload at least one bank statement file');
      return;
    }

    if (!ledgerFile) {
      message.error('Please upload a ledger file');
      return;
    }

    setUploading(true);

    // Simulate upload process
    setTimeout(() => {
      message.success('Files uploaded successfully! Redirecting to column mapping...');
      setTimeout(() => {
        navigate('/reconciliation/mapping');
      }, 1500);
    }, 2000);
  };

  const {
    getRootProps: getBankRootProps,
    getInputProps: getBankInputProps,
    isDragActive: isBankDragActive,
  } = useDropzone({
    onDrop: onDropBankFiles,
    accept: acceptedFileTypes,
    maxFiles: 3,
  });

  const {
    getRootProps: getLedgerRootProps,
    getInputProps: getLedgerInputProps,
    isDragActive: isLedgerDragActive,
  } = useDropzone({
    onDrop: onDropLedgerFile,
    accept: acceptedFileTypes,
    maxFiles: 1,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>New Reconciliation</Title>
        <Text type="secondary">
          Upload bank statements (1-3 files) and your ledger file to start the reconciliation process
        </Text>
      </div>

      <Alert
        message="Supported File Formats"
        description="CSV, XLS, XLSX files are supported. Maximum file size: 10MB per file."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Bank Files Upload */}
      <Card title="Bank Statement Files" style={{ marginBottom: 24 }}>
        <div
          {...getBankRootProps()}
          style={{
            border: `2px dashed ${isBankDragActive ? '#1890ff' : '#d9d9d9'}`,
            borderRadius: 8,
            padding: 48,
            textAlign: 'center',
            backgroundColor: isBankDragActive ? '#f0f5ff' : '#fafafa',
            cursor: 'pointer',
            marginBottom: bankFiles.length > 0 ? 24 : 0,
          }}
        >
          <input {...getBankInputProps()} />
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {isBankDragActive
                ? 'Drop the bank files here...'
                : 'Drag & drop bank statement files here, or click to select'}
            </Text>
            <Text type="secondary">
              Upload 1-3 bank statement files ({bankFiles.length}/3 uploaded)
            </Text>
          </div>
        </div>

        {bankFiles.length > 0 && (
          <List
            dataSource={bankFiles}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeBankFile(item.id)}
                  >
                    Remove
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={item.file.name}
                  description={`Size: ${formatFileSize(item.file.size)} • Type: ${item.file.type || 'Unknown'}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Ledger File Upload */}
      <Card title="Ledger File" style={{ marginBottom: 24 }}>
        <div
          {...getLedgerRootProps()}
          style={{
            border: `2px dashed ${isLedgerDragActive ? '#52c41a' : '#d9d9d9'}`,
            borderRadius: 8,
            padding: 48,
            textAlign: 'center',
            backgroundColor: isLedgerDragActive ? '#f6ffed' : '#fafafa',
            cursor: 'pointer',
            marginBottom: ledgerFile ? 24 : 0,
          }}
        >
          <input {...getLedgerInputProps()} />
          <InboxOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {isLedgerDragActive
                ? 'Drop the ledger file here...'
                : 'Drag & drop your ledger file here, or click to select'}
            </Text>
            <Text type="secondary">
              Upload 1 ledger file {ledgerFile ? '(✓ uploaded)' : ''}
            </Text>
          </div>
        </div>

        {ledgerFile && (
          <List
            dataSource={[ledgerFile]}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={removeLedgerFile}
                  >
                    Remove
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                  title={item.file.name}
                  description={`Size: ${formatFileSize(item.file.size)} • Type: ${item.file.type || 'Unknown'}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Action Buttons */}
      <Card>
        <Space size="middle">
          <Button size="large" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CloudUploadOutlined />}
            onClick={handleStartProcessing}
            loading={uploading}
            disabled={bankFiles.length === 0 || !ledgerFile}
          >
            Start Processing
          </Button>
        </Space>

        {(bankFiles.length === 0 || !ledgerFile) && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              {bankFiles.length === 0 && '• Upload at least one bank statement file'}
            </Text>
            <br />
            <Text type="secondary">
              {!ledgerFile && '• Upload a ledger file'}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UploadFiles;
