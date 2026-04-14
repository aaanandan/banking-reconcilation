import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Statistic,
  Tag,
  Tabs,
  Spin,
  Empty,
  message,
} from 'antd';
import {
  ReloadOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { QuestionCard } from './QuestionCard';
import { QuestionForm } from './QuestionForm';
import { QuestionFilters } from './QuestionFilters';
import {
  LearningQuestion,
  QuestionFilter,
  QuestionTiming,
  calculateQuestionStats,
  filterQuestions,
  groupIntoQueue,
  sortByPriority,
} from '../../utils/learningQuestionUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface LearningQuestionsManagerProps {
  questions: LearningQuestion[];
  loading?: boolean;
  onRefresh?: () => void;
  onAnswer: (questionId: string, answer: any) => void;
  answerLoading?: boolean;
}

/**
 * Main Learning Questions Management Interface
 */
export const LearningQuestionsManager: React.FC<LearningQuestionsManagerProps> = ({
  questions,
  loading = false,
  onRefresh,
  onAnswer,
  answerLoading = false,
}) => {
  const [filter, setFilter] = useState<QuestionFilter>({});
  const [selectedQuestion, setSelectedQuestion] = useState<LearningQuestion | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'queue'>('all');

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return filterQuestions(questions, filter);
  }, [questions, filter]);

  // Calculate statistics
  const stats = useMemo(() => calculateQuestionStats(filteredQuestions), [filteredQuestions]);

  // Group into queue
  const queue = useMemo(() => groupIntoQueue(filteredQuestions), [filteredQuestions]);

  // Sort all questions by priority
  const sortedQuestions = useMemo(() => sortByPriority(filteredQuestions), [filteredQuestions]);

  const handleAnswerClick = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setFormVisible(true);
    }
  };

  const handleSubmitAnswer = async (questionId: string, answer: any) => {
    try {
      await onAnswer(questionId, answer);
      message.success('Answer submitted successfully');
      setFormVisible(false);
      setSelectedQuestion(null);
    } catch (error) {
      message.error('Failed to submit answer');
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
    setSelectedQuestion(null);
  };

  const renderQueueSection = (title: string, questions: LearningQuestion[], icon: React.ReactNode) => {
    if (questions.length === 0) {
      return (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Empty description={`No ${title.toLowerCase()} questions`} />
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            {icon}
            <Text strong>{title}</Text>
            <Tag color="blue">{questions.length}</Tag>
          </Space>
        </div>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onAnswer={handleAnswerClick}
              compact
            />
          ))}
        </Space>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <QuestionCircleOutlined style={{ marginRight: 8 }} />
              Learning Questions
            </Title>
          </Col>
          <Col>
            <Space>
              {onRefresh && (
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                  Refresh
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Questions"
              value={stats.total}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Unanswered"
              value={stats.unanswered}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Answered"
              value={stats.answered}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Expired"
              value={stats.expired}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Priority Breakdown */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small" title="By Priority">
            <Space size={4} wrap>
              <Tag color="#cf1322">Critical: {stats.critical}</Tag>
              <Tag color="#ff4d4f">High: {stats.high}</Tag>
              <Tag color="#faad14">Medium: {stats.medium}</Tag>
              <Tag color="#52c41a">Low: {stats.low}</Tag>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="By Timing">
            <Space size={4} wrap>
              <Tag color="error">Immediate: {stats.byTiming[QuestionTiming.IMMEDIATE]}</Tag>
              <Tag color="warning">Step End: {stats.byTiming[QuestionTiming.STEP_END]}</Tag>
              <Tag color="processing">Session End: {stats.byTiming[QuestionTiming.SESSION_END]}</Tag>
              <Tag color="default">Deferred: {stats.byTiming[QuestionTiming.DEFERRED]}</Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={16}>
        {/* Filters */}
        <Col span={6}>
          <QuestionFilters onFilterChange={setFilter} initialFilter={filter} />
        </Col>

        {/* Questions List */}
        <Col span={18}>
          <Card
            size="small"
            title={
              <Space>
                <span>Questions</span>
                <Tag color="blue">{filteredQuestions.length}</Tag>
              </Space>
            }
            tabList={[
              { key: 'all', tab: 'All Questions' },
              { key: 'queue', tab: 'Priority Queue' },
            ]}
            activeTabKey={activeTab}
            onTabChange={(key) => setActiveTab(key as 'all' | 'queue')}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" tip="Loading questions..." />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <Empty
                description={
                  filter && Object.keys(filter).length > 0
                    ? 'No questions match your filters'
                    : 'No questions found'
                }
              />
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {activeTab === 'all' ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {sortedQuestions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onAnswer={handleAnswerClick}
                        showAnswer
                      />
                    ))}
                  </Space>
                ) : (
                  <Tabs defaultActiveKey="immediate" type="card">
                    <TabPane
                      tab={
                        <Space>
                          <span>Immediate</span>
                          <Tag color="error">{queue.immediate.length}</Tag>
                        </Space>
                      }
                      key="immediate"
                    >
                      {renderQueueSection(
                        'Immediate',
                        queue.immediate,
                        <ClockCircleOutlined style={{ color: '#cf1322' }} />
                      )}
                    </TabPane>
                    <TabPane
                      tab={
                        <Space>
                          <span>Step End</span>
                          <Tag color="warning">{queue.stepEnd.length}</Tag>
                        </Space>
                      }
                      key="stepEnd"
                    >
                      {renderQueueSection(
                        'Step End',
                        queue.stepEnd,
                        <ClockCircleOutlined style={{ color: '#faad14' }} />
                      )}
                    </TabPane>
                    <TabPane
                      tab={
                        <Space>
                          <span>Session End</span>
                          <Tag color="processing">{queue.sessionEnd.length}</Tag>
                        </Space>
                      }
                      key="sessionEnd"
                    >
                      {renderQueueSection(
                        'Session End',
                        queue.sessionEnd,
                        <ClockCircleOutlined style={{ color: '#1890ff' }} />
                      )}
                    </TabPane>
                    <TabPane
                      tab={
                        <Space>
                          <span>Deferred</span>
                          <Tag color="default">{queue.deferred.length}</Tag>
                        </Space>
                      }
                      key="deferred"
                    >
                      {renderQueueSection(
                        'Deferred',
                        queue.deferred,
                        <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                      )}
                    </TabPane>
                  </Tabs>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Answer Form Modal */}
      {selectedQuestion && (
        <QuestionForm
          visible={formVisible}
          question={selectedQuestion}
          onSubmit={handleSubmitAnswer}
          onCancel={handleFormCancel}
          loading={answerLoading}
        />
      )}
    </div>
  );
};

export default LearningQuestionsManager;
