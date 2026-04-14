import React from 'react';
import { Card, Row, Col, Alert, Progress, Tag, Divider, Collapse, Typography } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  AdvancedValidationSummary,
  DateFormatValidationResult,
  CurrencyValidationResult,
  DuplicateDetectionResult,
  MultiColumnValidationResult,
} from '../../utils/advancedValidation';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

interface AdvancedValidationPanelProps {
  validation: AdvancedValidationSummary;
}

/**
 * Component to display advanced validation results
 * Shows date format, currency, duplicates, and debit/credit validation
 */
export const AdvancedValidationPanel: React.FC<AdvancedValidationPanelProps> = ({
  validation,
}) => {
  const {
    dateFormatValidation,
    currencyValidation,
    duplicateDetection,
    debitCreditValidation,
    overallScore,
    criticalIssues,
    warnings,
    recommendations,
  } = validation;

  // Determine overall status color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#52c41a'; // green
    if (score >= 75) return '#1890ff'; // blue
    if (score >= 60) return '#faad14'; // orange
    return '#f5222d'; // red
  };

  const getScoreStatus = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <Card title="Advanced Validation Analysis" size="small">
      {/* Overall Score */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Overall Data Quality Score: {overallScore}/100</Text>
            <Tag
              color={getScoreColor(overallScore)}
              style={{ marginLeft: 8 }}
            >
              {getScoreStatus(overallScore)}
            </Tag>
          </div>
          <Progress
            percent={overallScore}
            strokeColor={getScoreColor(overallScore)}
            size="small"
          />
        </Col>
      </Row>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Alert
          type="error"
          icon={<CloseCircleOutlined />}
          message="Critical Issues"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              {criticalIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message="Warnings"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Detailed Validation Results */}
      <Collapse defaultActiveKey={[]} size="small">
        {/* Date Format Validation */}
        <Panel
          header={
            <span>
              {dateFormatValidation.isValid ? (
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#f5222d', marginRight: 8 }} />
              )}
              Date Format Validation
              {dateFormatValidation.detectedFormat && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {dateFormatValidation.detectedFormat}
                </Tag>
              )}
              <Tag
                color={dateFormatValidation.confidence >= 90 ? 'green' : 'orange'}
                style={{ marginLeft: 4 }}
              >
                {dateFormatValidation.confidence}% confidence
              </Tag>
            </span>
          }
          key="dateFormat"
        >
          <DateFormatPanel validation={dateFormatValidation} />
        </Panel>

        {/* Currency Validation */}
        <Panel
          header={
            <span>
              {currencyValidation.isValid ? (
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              ) : (
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
              )}
              Currency Format Validation
              {currencyValidation.detectedCurrency && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {currencyValidation.detectedCurrency}
                </Tag>
              )}
            </span>
          }
          key="currency"
        >
          <CurrencyPanel validation={currencyValidation} />
        </Panel>

        {/* Duplicate Detection */}
        <Panel
          header={
            <span>
              {duplicateDetection.hasDuplicates ? (
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
              ) : (
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              )}
              Duplicate Transaction Detection
              {duplicateDetection.hasDuplicates && (
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  {duplicateDetection.duplicateCount} duplicates
                </Tag>
              )}
            </span>
          }
          key="duplicates"
        >
          <DuplicatesPanel validation={duplicateDetection} />
        </Panel>

        {/* Debit/Credit Validation */}
        {debitCreditValidation.hasDebitCredit && (
          <Panel
            header={
              <span>
                {debitCreditValidation.isValid ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                ) : (
                  <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                )}
                Debit/Credit Column Validation
              </span>
            }
            key="debitCredit"
          >
            <DebitCreditPanel validation={debitCreditValidation} />
          </Panel>
        )}
      </Collapse>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Alert
            type="info"
            icon={<InfoCircleOutlined />}
            message="Recommendations"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            }
          />
        </>
      )}
    </Card>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const DateFormatPanel: React.FC<{ validation: DateFormatValidationResult }> = ({
  validation,
}) => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Status: </Text>
          <Text type={validation.isValid ? 'success' : 'danger'}>
            {validation.isValid ? 'Valid' : 'Invalid'}
          </Text>
        </Col>
        <Col span={12}>
          <Text strong>Detected Format: </Text>
          <Text>{validation.detectedFormat || 'None'}</Text>
        </Col>
      </Row>

      {validation.issues.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Issues:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Suggestions:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CurrencyPanel: React.FC<{ validation: CurrencyValidationResult }> = ({
  validation,
}) => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Status: </Text>
          <Text type={validation.isValid ? 'success' : 'warning'}>
            {validation.isValid ? 'Valid' : 'Issues Detected'}
          </Text>
        </Col>
        <Col span={12}>
          <Text strong>Currency: </Text>
          <Text>{validation.detectedCurrency || 'Not detected'}</Text>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={12}>
          <Text strong>Has Symbols: </Text>
          <Text>{validation.hasSymbols ? 'Yes' : 'No'}</Text>
        </Col>
        <Col span={12}>
          <Text strong>Mixed Formats: </Text>
          <Text type={validation.hasMixedFormats ? 'danger' : 'success'}>
            {validation.hasMixedFormats ? 'Yes (problem)' : 'No'}
          </Text>
        </Col>
      </Row>

      {validation.cleanedValues.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Sample Parsed Values: </Text>
          <Text code>{validation.cleanedValues.slice(0, 5).join(', ')}</Text>
        </div>
      )}

      {validation.issues.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Issues:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Suggestions:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const DuplicatesPanel: React.FC<{ validation: DuplicateDetectionResult }> = ({
  validation,
}) => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Text strong>Duplicates Found: </Text>
          <Text type={validation.hasDuplicates ? 'warning' : 'success'}>
            {validation.hasDuplicates ? 'Yes' : 'No'}
          </Text>
        </Col>
        <Col span={8}>
          <Text strong>Duplicate Count: </Text>
          <Text>{validation.duplicateCount}</Text>
        </Col>
        <Col span={8}>
          <Text strong>Percentage: </Text>
          <Text>{validation.duplicatePercentage}%</Text>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={12}>
          <Text strong>Unique Transactions: </Text>
          <Text>{validation.uniqueTransactionCount}</Text>
        </Col>
        <Col span={12}>
          <Text strong>Duplicate Groups: </Text>
          <Text>{validation.duplicateGroups.length}</Text>
        </Col>
      </Row>

      {validation.duplicateGroups.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Sample Duplicate Groups:</Text>
          <div style={{ marginTop: 8 }}>
            {validation.duplicateGroups.slice(0, 3).map((group, idx) => (
              <Card key={idx} size="small" style={{ marginTop: 8 }}>
                <Text strong>Group {idx + 1}: </Text>
                <Tag color="orange">{group.count} occurrences</Tag>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary">Date: {group.sampleValues.date}</Text>
                  <br />
                  <Text type="secondary">Amount: {group.sampleValues.amount}</Text>
                  <br />
                  <Text type="secondary">
                    Description: {group.sampleValues.description}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Warnings:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Suggestions:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const DebitCreditPanel: React.FC<{
  validation: MultiColumnValidationResult;
}> = ({ validation }) => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Status: </Text>
          <Text type={validation.isValid ? 'success' : 'warning'}>
            {validation.isValid ? 'Valid' : 'Issues Detected'}
          </Text>
        </Col>
        <Col span={12}>
          <Text strong>Balance Status: </Text>
          <Tag
            color={
              validation.debitCreditBalance === 'valid'
                ? 'green'
                : validation.debitCreditBalance === 'imbalanced'
                ? 'orange'
                : 'default'
            }
          >
            {validation.debitCreditBalance.replace('_', ' ').toUpperCase()}
          </Tag>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={8}>
          <Text strong>Total Debit: </Text>
          <Text code>{validation.totalDebit.toFixed(2)}</Text>
        </Col>
        <Col span={8}>
          <Text strong>Total Credit: </Text>
          <Text code>{validation.totalCredit.toFixed(2)}</Text>
        </Col>
        <Col span={8}>
          <Text strong>Net Difference: </Text>
          <Text code>{validation.netDifference.toFixed(2)}</Text>
        </Col>
      </Row>

      {validation.balanceIssues.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Balance Issues:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.balanceIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong>Suggestions:</Text>
          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
            {validation.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
