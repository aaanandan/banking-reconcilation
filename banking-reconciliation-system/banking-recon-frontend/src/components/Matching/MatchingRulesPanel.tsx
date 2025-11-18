import React, { useState } from 'react';
import { Card, Form, InputNumber, Switch, Slider, Button, Space, Collapse, Typography } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { MatchingRules, DEFAULT_MATCHING_RULES } from '../../utils/matchingAlgorithms';

const { Panel } = Collapse;
const { Text } = Typography;

interface MatchingRulesPanelProps {
  rules: MatchingRules;
  onRulesChange: (rules: MatchingRules) => void;
  onReset?: () => void;
}

/**
 * Panel to configure matching rules and parameters
 */
export const MatchingRulesPanel: React.FC<MatchingRulesPanelProps> = ({
  rules,
  onRulesChange,
  onReset,
}) => {
  const [form] = Form.useForm();

  const handleReset = () => {
    form.setFieldsValue(DEFAULT_MATCHING_RULES);
    onRulesChange(DEFAULT_MATCHING_RULES);
    if (onReset) onReset();
  };

  const handleValuesChange = (_: any, allValues: any) => {
    onRulesChange(allValues as MatchingRules);
  };

  return (
    <Card
      size="small"
      title={<><SettingOutlined /> Matching Rules</>}
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
          Reset
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={rules}
        onValuesChange={handleValuesChange}
      >
        {/* Amount Matching */}
        <Collapse defaultActiveKey={['amount', 'weights']} ghost>
          <Panel header="Amount Matching" key="amount">
            <Form.Item
              name="amountTolerance"
              label="Absolute Tolerance ($)"
              tooltip="Maximum dollar difference to consider a match"
            >
              <InputNumber
                min={0}
                max={100}
                step={0.01}
                precision={2}
                prefix="$"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="amountTolerancePercent"
              label="Percentage Tolerance (%)"
              tooltip="Maximum percentage difference to consider a match"
            >
              <InputNumber
                min={0}
                max={10}
                step={0.1}
                precision={1}
                suffix="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Panel>

          {/* Date Matching */}
          <Panel header="Date Matching" key="date">
            <Form.Item
              name="maxDateDifferenceDays"
              label="Maximum Date Difference (days)"
              tooltip="Maximum days apart for transactions to match"
            >
              <Slider min={0} max={30} marks={{ 0: '0', 7: '7', 14: '14', 30: '30' }} />
            </Form.Item>
          </Panel>

          {/* Description Matching */}
          <Panel header="Description Matching" key="description">
            <Form.Item
              name="descriptionMinSimilarity"
              label="Minimum Similarity"
              tooltip="Minimum text similarity (0-1) for descriptions to match"
            >
              <Slider
                min={0}
                max={1}
                step={0.1}
                marks={{ 0: '0%', 0.5: '50%', 1: '100%' }}
                tipFormatter={(value) => `${Math.round((value || 0) * 100)}%`}
              />
            </Form.Item>

            <Form.Item
              name="useDescriptionFuzzy"
              label="Use Fuzzy Matching"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          {/* Reference Matching */}
          <Panel header="Reference Matching" key="reference">
            <Form.Item
              name="requireReferenceMatch"
              label="Require Reference Match"
              tooltip="Must references match if both transactions have them"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Panel>

          {/* Scoring Weights */}
          <Panel header="Scoring Weights" key="weights">
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
              Adjust how much each field contributes to overall score. Total should equal 1.0.
            </Text>

            <Form.Item name={['weights', 'amount']} label="Amount Weight">
              <Slider min={0} max={1} step={0.05} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
            </Form.Item>

            <Form.Item name={['weights', 'date']} label="Date Weight">
              <Slider min={0} max={1} step={0.05} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
            </Form.Item>

            <Form.Item name={['weights', 'description']} label="Description Weight">
              <Slider min={0} max={1} step={0.05} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
            </Form.Item>

            <Form.Item name={['weights', 'reference']} label="Reference Weight">
              <Slider min={0} max={1} step={0.05} marks={{ 0: '0%', 0.5: '50%', 1: '100%' }} />
            </Form.Item>

            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Current total:{' '}
                {(
                  (rules.weights.amount || 0) +
                  (rules.weights.date || 0) +
                  (rules.weights.description || 0) +
                  (rules.weights.reference || 0)
                ).toFixed(2)}
              </Text>
            </div>
          </Panel>

          {/* Filtering */}
          <Panel header="Filtering" key="filtering">
            <Form.Item
              name="minOverallScore"
              label="Minimum Overall Score"
              tooltip="Minimum score (0-100) to show as candidate"
            >
              <Slider min={0} max={100} marks={{ 0: '0', 50: '50', 75: '75', 100: '100' }} />
            </Form.Item>

            <Form.Item
              name="maxCandidates"
              label="Maximum Candidates"
              tooltip="Maximum number of candidates to display"
            >
              <InputNumber min={1} max={50} style={{ width: '100%' }} />
            </Form.Item>
          </Panel>
        </Collapse>
      </Form>
    </Card>
  );
};

export default MatchingRulesPanel;
