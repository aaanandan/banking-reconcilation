import React, { useState } from 'react';
import { Card, Upload, Button, Space, Row, Col, Statistic, Alert, Typography } from 'antd';
import { UploadOutlined, CloudUploadOutlined, RightOutlined, BankOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { FileUploadCard } from './FileUploadCard';
import {
  UploadedFile,
  FileType,
  UploadStatus,
  createUploadedFile,
  validateFile,
  calculateUploadSummary,
  canAddBankFile,
  canAddLedgerFile,
  sortFiles,
  isReadyForNextStep,
  formatFileSize,
  MAX_BANK_FILES,
  MAX_LEDGER_FILES,
} from '../../utils/uploadUtils';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface MultiUploadProps {
  onNext: (files: UploadedFile[]) => void;
  onUploadFile?: (file: File, type: FileType) => Promise<UploadedFile>;
}

export const MultiUpload: React.FC<MultiUploadProps> = ({ onNext, onUploadFile }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleFileAdd = async (file: File, type: FileType) => {
    const validation = validateFile(file, type, files);
    if (validation.status === 'invalid') return false;

    const uploadedFile = createUploadedFile(file, type);
    uploadedFile.validationStatus = validation.status;
    uploadedFile.validationMessages = validation.messages;

    setFiles((prev) => [...prev, uploadedFile]);

    if (onUploadFile) {
      try {
        const processedFile = await onUploadFile(file, type);
        setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...processedFile, id: uploadedFile.id } : f)));
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: UploadStatus.ERROR, validationMessages: ['Upload failed'] } : f
          )
        );
      }
    } else {
      setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: UploadStatus.SUCCESS } : f)));
    }

    return false;
  };

  const handleRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleNext = () => {
    const readyCheck = isReadyForNextStep(files);
    if (readyCheck.ready) {
      onNext(files);
    }
  };

  const summary = calculateUploadSummary(files);
  const readyCheck = isReadyForNextStep(files);
  const sortedFiles = sortFiles(files);

  const bankUploadProps: UploadProps = {
    accept: '.csv,.xlsx,.xls,.pdf',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => handleFileAdd(file, FileType.BANK_STATEMENT),
  };

  const ledgerUploadProps: UploadProps = {
    accept: '.csv,.xlsx,.xls,.pdf',
    showUploadList: false,
    beforeUpload: (file) => handleFileAdd(file, FileType.LEDGER),
  };

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CloudUploadOutlined style={{ marginRight: 8 }} />
          Upload Files
        </Title>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Files" value={summary.totalFiles} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Bank Files" value={`${summary.bankFiles}/${MAX_BANK_FILES}`} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Ledger Files" value={`${summary.ledgerFiles}/${MAX_LEDGER_FILES}`} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Size" value={formatFileSize(summary.totalSize)} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Dragger {...bankUploadProps} disabled={!canAddBankFile(files)}>
            <p className="ant-upload-drag-icon">
              <BankOutlined style={{ color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">Bank Statement Files</p>
            <p className="ant-upload-hint">
              Click or drag bank statement files here (up to {MAX_BANK_FILES} files)
              <br />
              Supported: CSV, Excel, PDF
            </p>
          </Dragger>
        </Col>

        <Col span={12}>
          <Dragger {...ledgerUploadProps} disabled={!canAddLedgerFile(files)}>
            <p className="ant-upload-drag-icon">
              <FileTextOutlined style={{ color: '#52c41a' }} />
            </p>
            <p className="ant-upload-text">Ledger File</p>
            <p className="ant-upload-hint">
              Click or drag ledger file here ({MAX_LEDGER_FILES} file required)
              <br />
              Supported: CSV, Excel, PDF
            </p>
          </Dragger>
        </Col>
      </Row>

      {sortedFiles.length > 0 && (
        <Card title="Uploaded Files" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {sortedFiles.map((file) => (
              <FileUploadCard key={file.id} file={file} onRemove={handleRemove} />
            ))}
          </Space>
        </Card>
      )}

      {!readyCheck.ready && files.length > 0 && (
        <Alert type="warning" message={readyCheck.message} showIcon style={{ marginBottom: 16 }} />
      )}

      {readyCheck.ready && (
        <Alert
          type="success"
          message="All files ready! Click 'Next' to proceed to column mapping."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" size="large" icon={<RightOutlined />} onClick={handleNext} disabled={!readyCheck.ready}>
          Next: Column Mapping
        </Button>
      </div>
    </div>
  );
};

export default MultiUpload;
