import React from 'react';
import { Card, Space, Tag, Progress, Typography, Button, Alert, List } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
  UploadedFile,
  UploadStatus,
  ValidationStatus,
  getFormatLabel,
  getFormatIcon,
  getStatusColor,
  getValidationStatusColor,
  getFileTypeLabel,
  getFileTypeColor,
  formatFileSize,
} from '../../utils/uploadUtils';

const { Text } = Typography;

interface FileUploadCardProps {
  file: UploadedFile;
  onRemove: (fileId: string) => void;
}

/**
 * Individual file upload card with status and validation
 */
export const FileUploadCard: React.FC<FileUploadCardProps> = ({ file, onRemove }) => {
  const getStatusIcon = () => {
    switch (file.validationStatus) {
      case ValidationStatus.VALID:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case ValidationStatus.WARNING:
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case ValidationStatus.INVALID:
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  return (
    <Card
      size="small"
      style={{
        borderLeft: `4px solid ${getFileTypeColor(file.type)}`,
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space direction="vertical" size={4}>
            <Space>
              {React.createElement(require('@ant-design/icons')[getFormatIcon(file.format)])}
              <Text strong>{file.file.name}</Text>
              {getStatusIcon()}
            </Space>
            <Space size={8} wrap>
              <Tag color={getFileTypeColor(file.type)}>{getFileTypeLabel(file.type)}</Tag>
              <Tag>{getFormatLabel(file.format)}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatFileSize(file.size)}
              </Text>
              {file.rowCount !== undefined && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {file.rowCount} rows
                </Text>
              )}
              {file.columnCount !== undefined && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {file.columnCount} columns
                </Text>
              )}
            </Space>
          </Space>

          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(file.id)}
            size="small"
          />
        </div>

        {/* Progress Bar */}
        {(file.status === UploadStatus.UPLOADING || file.status === UploadStatus.PROCESSING) && (
          <Progress
            percent={file.progress}
            status={file.status === UploadStatus.UPLOADING ? 'active' : 'normal'}
            size="small"
          />
        )}

        {/* Status Tag */}
        {file.status !== UploadStatus.IDLE && (
          <Tag color={getStatusColor(file.status)}>
            {file.status === UploadStatus.UPLOADING && 'Uploading...'}
            {file.status === UploadStatus.PROCESSING && 'Processing...'}
            {file.status === UploadStatus.SUCCESS && 'Ready'}
            {file.status === UploadStatus.ERROR && 'Error'}
          </Tag>
        )}

        {/* Validation Messages */}
        {file.validationMessages.length > 0 && (
          <Alert
            type={
              file.validationStatus === ValidationStatus.INVALID
                ? 'error'
                : file.validationStatus === ValidationStatus.WARNING
                ? 'warning'
                : 'info'
            }
            message={
              <List
                size="small"
                dataSource={file.validationMessages}
                renderItem={(msg) => <List.Item style={{ padding: '4px 0', border: 'none' }}>{msg}</List.Item>}
              />
            }
            showIcon
            style={{ marginTop: 8 }}
          />
        )}

        {/* Preview */}
        {file.preview && file.preview.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Preview (first 3 rows):
            </Text>
            <div
              style={{
                marginTop: 4,
                padding: 8,
                backgroundColor: '#fafafa',
                borderRadius: 4,
                fontSize: 11,
                overflowX: 'auto',
              }}
            >
              {file.preview.slice(0, 3).map((row, idx) => (
                <div key={idx}>{row.slice(0, 5).join(' | ')}</div>
              ))}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default FileUploadCard;
