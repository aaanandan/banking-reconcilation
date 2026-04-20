import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Space, Typography, Statistic, Empty, Spin, message } from 'antd';
import { PlusOutlined, ReloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { ReportCard } from './ReportCard';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import {
  Report,
  ReportType,
  ExportFormat,
  ReportFilter,
  ReportStatus,
  filterReports,
  sortReports,
} from '../../utils/reportUtils';

const { Title } = Typography;

interface ReportsManagerProps {
  reports: Report[];
  loading?: boolean;
  onRefresh?: () => void;
  onGenerate: (type: ReportType, format: ExportFormat, filter: ReportFilter) => void;
  onDownload: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  generating?: boolean;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  reports,
  loading = false,
  onRefresh,
  onGenerate,
  onDownload,
  onDelete,
  generating = false,
}) => {
  const [generatorVisible, setGeneratorVisible] = useState(false);

  const sortedReports = useMemo(() => {
    return sortReports(reports, 'createdAt', 'desc');
  }, [reports]);

  const pendingCount = reports.filter((r) => r.status === ReportStatus.PENDING).length;
  const generatingCount = reports.filter((r) => r.status === ReportStatus.GENERATING).length;
  const completedCount = reports.filter((r) => r.status === ReportStatus.COMPLETED).length;
  const failedCount = reports.filter((r) => r.status === ReportStatus.FAILED).length;

  const handleGenerate = (type: ReportType, format: ExportFormat, filter: ReportFilter) => {
    onGenerate(type, format, filter);
    setGeneratorVisible(false);
    message.success('Report generation started');
  };

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 8 }} />
              Reports & Analytics
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setGeneratorVisible(true)}
              >
                Generate Report
              </Button>
              {onRefresh && (
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                  Refresh
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Reports" value={reports.length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Completed" value={completedCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Generating" value={generatingCount} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Failed" value={failedCount} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={`All Reports (${sortedReports.length})`}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" tip="Loading reports..." />
          </div>
        ) : sortedReports.length === 0 ? (
          <Empty
            description="No reports generated yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setGeneratorVisible(true)}>
              Generate Your First Report
            </Button>
          </Empty>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {sortedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </Card>

      <ReportGeneratorModal
        visible={generatorVisible}
        onGenerate={handleGenerate}
        onCancel={() => setGeneratorVisible(false)}
        loading={generating}
      />
    </div>
  );
};

export default ReportsManager;
