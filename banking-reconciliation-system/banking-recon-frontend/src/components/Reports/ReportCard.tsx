import React from 'react';
import { Card, Tag, Button, Space, Typography, Progress } from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import {
  Report,
  ReportStatus,
  ExportFormat,
  getReportTypeLabel,
  getReportStatusLabel,
  getReportStatusColor,
  getExportFormatLabel,
  formatFileSize,
} from '../../utils/reportUtils';

const { Text } = Typography;

interface ReportCardProps {
  report: Report;
  onDownload?: (reportId: string) => void;
  onDelete?: (reportId: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onDownload,
  onDelete,
}) => {
  const getFormatIcon = () => {
    switch (report.format) {
      case ExportFormat.PDF:
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case ExportFormat.EXCEL:
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <Space direction="vertical" size={4} style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getFormatIcon()}
            <Text strong>{report.title}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {report.description}
          </Text>
          <Space size={8} wrap>
            <Tag color={getReportStatusColor(report.status)}>
              {getReportStatusLabel(report.status)}
            </Tag>
            <Tag>{getExportFormatLabel(report.format)}</Tag>
            {report.fileSize && <Text type="secondary" style={{ fontSize: 11 }}>{formatFileSize(report.fileSize)}</Text>}
          </Space>
          {report.status === ReportStatus.GENERATING && (
            <Progress percent={50} size="small" status="active" style={{ marginTop: 8 }} />
          )}
          <Text type="secondary" style={{ fontSize: 11 }}>
            {report.generatedAt
              ? `Generated ${new Date(report.generatedAt).toLocaleString()}`
              : `Created ${new Date(report.createdAt).toLocaleString()}`}
          </Text>
        </Space>
        <Space>
          {report.status === ReportStatus.COMPLETED && onDownload && (
            <Button
              size="small"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(report.id)}
            >
              Download
            </Button>
          )}
          {onDelete && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(report.id)}
            />
          )}
        </Space>
      </div>
    </Card>
  );
};

export default ReportCard;
