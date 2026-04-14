import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Radio,
  InputNumber,
  Button,
  Space,
  Alert,
  Typography,
  message,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  LearningQuestion,
  AnswerType,
  validateAnswer,
  getQuestionTypeLabel,
} from '../../utils/learningQuestionUtils';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface QuestionFormProps {
  visible: boolean;
  question: LearningQuestion;
  onSubmit: (questionId: string, answer: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Form for answering a learning question
 */
export const QuestionForm: React.FC<QuestionFormProps> = ({
  visible,
  question,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [answer, setAnswer] = useState<any>(null);

  const handleSubmit = () => {
    // Validate answer
    const validation = validateAnswer(answer, question.answerType, question.suggestedAnswers);

    if (!validation.valid) {
      message.error(validation.error || 'Invalid answer');
      return;
    }

    // Submit answer
    onSubmit(question.id, answer);

    // Reset form
    form.resetFields();
    setAnswer(null);
  };

  const handleCancel = () => {
    form.resetFields();
    setAnswer(null);
    onCancel();
  };

  const renderAnswerInput = () => {
    switch (question.answerType) {
      case AnswerType.TEXT:
        return (
          <TextArea
            rows={4}
            placeholder="Enter your answer..."
            value={answer || ''}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={1000}
            showCount
          />
        );

      case AnswerType.CHOICE:
        if (!question.suggestedAnswers || question.suggestedAnswers.length === 0) {
          return <Alert message="No answer choices available" type="warning" />;
        }
        return (
          <Radio.Group
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {question.suggestedAnswers.map((option, index) => (
                <Radio key={index} value={option} style={{ fontSize: 14 }}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case AnswerType.BOOLEAN:
        return (
          <Radio.Group value={answer} onChange={(e) => setAnswer(e.target.value)}>
            <Space size={16}>
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Space>
          </Radio.Group>
        );

      case AnswerType.NUMBER:
        return (
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter a number..."
            value={answer}
            onChange={(value) => setAnswer(value)}
          />
        );

      default:
        return <Input placeholder="Enter your answer..." onChange={(e) => setAnswer(e.target.value)} />;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          <span>Answer Question</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Submit Answer"
      cancelText="Cancel"
      width={700}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {getQuestionTypeLabel(question.type)}
        </Text>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
          {question.question}
        </Title>
      </div>

      {/* Context */}
      {question.context && (
        <Alert
          message="Context"
          description={question.context}
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Help Text */}
      {question.helpText && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            <strong>Help:</strong> {question.helpText}
          </Text>
        </div>
      )}

      {/* Example Answer */}
      {question.exampleAnswer && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
            <strong>Example:</strong> {question.exampleAnswer}
          </Text>
        </div>
      )}

      {/* Answer Input */}
      <Form form={form} layout="vertical">
        <Form.Item
          label="Your Answer"
          required
          help={
            question.answerType === AnswerType.TEXT
              ? 'Provide a clear and specific answer'
              : question.answerType === AnswerType.CHOICE
              ? 'Select one of the options'
              : question.answerType === AnswerType.BOOLEAN
              ? 'Select Yes or No'
              : 'Enter a numeric value'
          }
        >
          {renderAnswerInput()}
        </Form.Item>
      </Form>

      {/* Related Information */}
      {(question.relatedEntityId ||
        question.relatedTransactionIds.length > 0 ||
        question.relatedReconciliationId) && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space direction="vertical" size={4}>
            <Text strong style={{ fontSize: 12 }}>
              Related Information:
            </Text>
            {question.relatedEntityId && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Entity: {question.relatedEntityId}
              </Text>
            )}
            {question.relatedTransactionIds.length > 0 && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Transactions: {question.relatedTransactionIds.length} transaction(s)
              </Text>
            )}
            {question.relatedReconciliationId && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Reconciliation: {question.relatedReconciliationId}
              </Text>
            )}
            <Text type="secondary" style={{ fontSize: 11 }}>
              Triggered by: {question.triggeredBy}
            </Text>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default QuestionForm;
