import React from 'react';
import { Form, Input, Select, InputNumber, Switch, Tabs, Divider, Space, Tag, List, Button } from 'antd';
import {
  SettingOutlined,
  ReconciliationOutlined,
  BulbOutlined,
  BellOutlined,
  ApiOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Settings,
  SettingsCategory,
  NotificationChannel,
  NotificationEvent,
  DataRetentionPeriod,
  TIMEZONES,
  DATE_FORMATS,
  CURRENCIES,
  LANGUAGES,
  getRetentionPeriodLabel,
} from '../../utils/settingsUtils';

const { TabPane } = Tabs;
const { TextArea } = Input;

interface SettingsFormProps {
  settings: Settings;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  form: any;
}

/**
 * Tabbed settings form with 7 categories
 */
export const SettingsForm: React.FC<SettingsFormProps> = ({ settings, onValuesChange, form }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={settings}
      onValuesChange={onValuesChange}
    >
      <Tabs defaultActiveKey="general" type="card">
        {/* General Settings Tab */}
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              General
            </span>
          }
          key="general"
        >
          <Form.Item
            name={['general', 'companyName']}
            label="Company Name"
            rules={[{ required: true, message: 'Company name is required' }]}
          >
            <Input placeholder="Enter company name" maxLength={100} />
          </Form.Item>

          <Form.Item name={['general', 'timezone']} label="Timezone">
            <Select options={TIMEZONES} showSearch />
          </Form.Item>

          <Form.Item name={['general', 'dateFormat']} label="Date Format">
            <Select options={DATE_FORMATS} />
          </Form.Item>

          <Form.Item name={['general', 'timeFormat']} label="Time Format">
            <Select
              options={[
                { label: '12-hour (AM/PM)', value: '12h' },
                { label: '24-hour', value: '24h' },
              ]}
            />
          </Form.Item>

          <Form.Item name={['general', 'currency']} label="Currency">
            <Select options={CURRENCIES} showSearch />
          </Form.Item>

          <Form.Item name={['general', 'language']} label="Language">
            <Select options={LANGUAGES} />
          </Form.Item>

          <Form.Item
            name={['general', 'fiscalYearStart']}
            label="Fiscal Year Start (MM-DD)"
            rules={[
              {
                pattern: /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
                message: 'Must be in MM-DD format',
              },
            ]}
          >
            <Input placeholder="01-01" />
          </Form.Item>
        </TabPane>

        {/* Reconciliation Settings Tab */}
        <TabPane
          tab={
            <span>
              <ReconciliationOutlined />
              Reconciliation
            </span>
          }
          key="reconciliation"
        >
          <Form.Item
            name={['reconciliation', 'defaultMatchThreshold']}
            label="Default Match Threshold"
            help="Minimum confidence score to suggest a match (0-100%)"
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              formatter={(value) => `${((value || 0) * 100).toFixed(0)}%`}
              parser={(value) => (parseFloat(value?.replace('%', '') || '0') / 100)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name={['reconciliation', 'autoMatchThreshold']}
            label="Auto-Match Threshold"
            help="Minimum confidence score to automatically match (0-100%)"
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              formatter={(value) => `${((value || 0) * 100).toFixed(0)}%`}
              parser={(value) => (parseFloat(value?.replace('%', '') || '0') / 100)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name={['reconciliation', 'requireApprovalAboveAmount']}
            label="Require Approval Above Amount"
            help="Matches above this amount require manual approval"
          >
            <InputNumber
              min={0}
              formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') || '0')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name={['reconciliation', 'allowManualOverrides']}
            label="Allow Manual Overrides"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['reconciliation', 'enableAlternativeMatches']}
            label="Enable Alternative Matches"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['reconciliation', 'maxAlternativeMatches']}
            label="Max Alternative Matches"
            help="Maximum number of alternative matches to display"
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Divider>Urgency Thresholds (Days Unmatched)</Divider>

          <Form.Item name={['reconciliation', 'urgencyMediumDays']} label="Medium Urgency">
            <InputNumber min={1} max={180} suffix="days" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name={['reconciliation', 'urgencyHighDays']} label="High Urgency">
            <InputNumber min={1} max={180} suffix="days" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name={['reconciliation', 'urgencyCriticalDays']} label="Critical Urgency">
            <InputNumber min={1} max={180} suffix="days" style={{ width: '100%' }} />
          </Form.Item>
        </TabPane>

        {/* Learning Settings Tab */}
        <TabPane
          tab={
            <span>
              <BulbOutlined />
              Learning
            </span>
          }
          key="learning"
        >
          <Form.Item
            name={['learning', 'enableLearning']}
            label="Enable Learning System"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name={['learning', 'questionTimingPreference']} label="Question Timing Preference">
            <Select
              options={[
                { label: 'Ask Immediately', value: 'immediate' },
                { label: 'Ask at Step End', value: 'step_end' },
                { label: 'Ask at Session End', value: 'session_end' },
                { label: 'Defer for Later', value: 'deferred' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name={['learning', 'minConfidenceForAutoAccept']}
            label="Min Confidence for Auto-Accept"
            help="Automatically accept learned patterns above this confidence"
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              formatter={(value) => `${((value || 0) * 100).toFixed(0)}%`}
              parser={(value) => (parseFloat(value?.replace('%', '') || '0') / 100)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name={['learning', 'maxQuestionsPerSession']}
            label="Max Questions Per Session"
            help="Maximum learning questions to ask in one session"
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name={['learning', 'enableSmartSuggestions']}
            label="Enable Smart Suggestions"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name={['learning', 'learningAggressiveness']} label="Learning Aggressiveness">
            <Select
              options={[
                { label: 'Conservative - Fewer questions, higher confidence', value: 'conservative' },
                { label: 'Moderate - Balanced approach', value: 'moderate' },
                { label: 'Aggressive - More questions, faster learning', value: 'aggressive' },
              ]}
            />
          </Form.Item>
        </TabPane>

        {/* Notifications Settings Tab */}
        <TabPane
          tab={
            <span>
              <BellOutlined />
              Notifications
            </span>
          }
          key="notifications"
        >
          <Form.Item name={['notifications', 'emailAddress']} label="Email Address">
            <Input type="email" placeholder="user@example.com" />
          </Form.Item>

          <Divider>Email Notifications</Divider>
          <Form.Item
            name={['notifications', 'preferences', 0, 'enabled']}
            label="Enable Email Notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name={['notifications', 'preferences', 0, 'events']} label="Email Events">
            <Select
              mode="multiple"
              placeholder="Select events"
              options={Object.values(NotificationEvent).map((event) => ({
                label: event.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                value: event,
              }))}
            />
          </Form.Item>

          <Divider>Slack Notifications</Divider>
          <Form.Item name={['notifications', 'slackWebhook']} label="Slack Webhook URL">
            <Input placeholder="https://hooks.slack.com/services/..." />
          </Form.Item>

          <Form.Item
            name={['notifications', 'preferences', 1, 'enabled']}
            label="Enable Slack Notifications"
            valuePropName="checked"
            dependencies={[['notifications', 'slackWebhook']]}
          >
            <Switch />
          </Form.Item>

          <Divider>Custom Webhook</Divider>
          <Form.Item name={['notifications', 'customWebhook']} label="Custom Webhook URL">
            <Input placeholder="https://your-webhook.com/..." />
          </Form.Item>

          <Divider>Quiet Hours</Divider>
          <Form.Item
            name={['notifications', 'quietHoursEnabled']}
            label="Enable Quiet Hours"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Space>
            <Form.Item name={['notifications', 'quietHoursStart']} label="Start Time (HH:MM)">
              <Input placeholder="22:00" />
            </Form.Item>

            <Form.Item name={['notifications', 'quietHoursEnd']} label="End Time (HH:MM)">
              <Input placeholder="08:00" />
            </Form.Item>
          </Space>
        </TabPane>

        {/* Integrations Settings Tab */}
        <TabPane
          tab={
            <span>
              <ApiOutlined />
              Integrations
            </span>
          }
          key="integrations"
        >
          <Form.Item
            name={['integrations', 'apiKeysEnabled']}
            label="Enable API Keys"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider>API Keys</Divider>
          <Form.List name={['integrations', 'apiKeys']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...field} name={[field.name, 'name']} rules={[{ required: true }]}>
                      <Input placeholder="API Key Name" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'key']}>
                      <Input.Password placeholder="API Key" disabled />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(field.name)} icon={<DeleteOutlined />} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add API Key
                </Button>
              </>
            )}
          </Form.List>

          <Divider>Webhooks</Divider>
          <Form.Item
            name={['integrations', 'webhooksEnabled']}
            label="Enable Webhooks"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.List name={['integrations', 'webhooks']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div key={field.key} style={{ marginBottom: 16, padding: 16, border: '1px solid #f0f0f0' }}>
                    <Form.Item {...field} name={[field.name, 'name']} label="Name" rules={[{ required: true }]}>
                      <Input placeholder="Webhook Name" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'url']} label="URL" rules={[{ required: true }]}>
                      <Input placeholder="https://..." />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'events']} label="Events">
                      <Select mode="multiple" placeholder="Select events" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'enabled']} valuePropName="checked">
                      <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(field.name)} icon={<DeleteOutlined />}>
                      Remove Webhook
                    </Button>
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Webhook
                </Button>
              </>
            )}
          </Form.List>
        </TabPane>

        {/* Security Settings Tab */}
        <TabPane
          tab={
            <span>
              <SafetyOutlined />
              Security
            </span>
          }
          key="security"
        >
          <Form.Item
            name={['security', 'sessionTimeout']}
            label="Session Timeout (minutes)"
            help="Users will be logged out after this period of inactivity"
          >
            <InputNumber min={5} max={480} suffix="min" style={{ width: '100%' }} />
          </Form.Item>

          <Divider>Password Policy</Divider>

          <Form.Item name={['security', 'passwordMinLength']} label="Minimum Length">
            <InputNumber min={6} max={32} suffix="characters" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name={['security', 'passwordRequireUppercase']}
            label="Require Uppercase Letters"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['security', 'passwordRequireLowercase']}
            label="Require Lowercase Letters"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['security', 'passwordRequireNumbers']}
            label="Require Numbers"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['security', 'passwordRequireSpecialChars']}
            label="Require Special Characters"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['security', 'passwordExpiryDays']}
            label="Password Expiry (days)"
            help="Set to 0 for no expiry"
          >
            <InputNumber min={0} max={365} suffix="days" style={{ width: '100%' }} />
          </Form.Item>

          <Divider>Multi-Factor Authentication</Divider>

          <Form.Item name={['security', 'mfaEnabled']} label="Enable MFA" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name={['security', 'mfaRequired']}
            label="Require MFA for All Users"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider>IP Whitelist</Divider>

          <Form.Item
            name={['security', 'ipWhitelistEnabled']}
            label="Enable IP Whitelist"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.List name={['security', 'ipWhitelist']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      rules={[
                        { required: true, message: 'IP address required' },
                        { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'Invalid IP format' },
                      ]}
                    >
                      <Input placeholder="192.168.1.1" />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(field.name)} icon={<DeleteOutlined />} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add IP Address
                </Button>
              </>
            )}
          </Form.List>
        </TabPane>

        {/* Data & Privacy Settings Tab */}
        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              Data & Privacy
            </span>
          }
          key="data"
        >
          <Divider>Data Retention Policies</Divider>

          <Form.Item name={['data', 'transactionRetention']} label="Transaction Data Retention">
            <Select
              options={Object.values(DataRetentionPeriod).map((period) => ({
                label: getRetentionPeriodLabel(period),
                value: period,
              }))}
            />
          </Form.Item>

          <Form.Item name={['data', 'reconciliationRetention']} label="Reconciliation Data Retention">
            <Select
              options={Object.values(DataRetentionPeriod).map((period) => ({
                label: getRetentionPeriodLabel(period),
                value: period,
              }))}
            />
          </Form.Item>

          <Form.Item name={['data', 'auditLogRetention']} label="Audit Log Retention">
            <Select
              options={Object.values(DataRetentionPeriod).map((period) => ({
                label: getRetentionPeriodLabel(period),
                value: period,
              }))}
            />
          </Form.Item>

          <Divider>Backup Settings</Divider>

          <Form.Item
            name={['data', 'autoBackupEnabled']}
            label="Enable Automatic Backups"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name={['data', 'backupFrequency']} label="Backup Frequency">
            <Select
              options={[
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
              ]}
            />
          </Form.Item>

          <Divider>Export Settings</Divider>

          <Form.Item name={['data', 'exportFormat']} label="Default Export Format">
            <Select
              options={[
                { label: 'Excel Spreadsheet', value: 'excel' },
                { label: 'CSV File', value: 'csv' },
                { label: 'JSON Data', value: 'json' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name={['data', 'anonymizeExports']}
            label="Anonymize Exported Data"
            help="Remove personally identifiable information from exports"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </TabPane>
      </Tabs>
    </Form>
  );
};

export default SettingsForm;
