import React from 'react';
import { Collapse, Space, Tag, Typography, Button } from 'antd';
import { QuestionCircleOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import { FAQ, getCategoryLabel, calculateHelpfulnessScore } from '../../utils/helpUtils';
import ReactMarkdown from 'react-markdown';

const { Panel } = Collapse;
const { Text } = Typography;

interface FAQListProps {
  faqs: FAQ[];
  onFeedback?: (faqId: string, helpful: boolean) => void;
}

/**
 * FAQ list component with collapsible panels
 */
export const FAQList: React.FC<FAQListProps> = ({ faqs, onFeedback }) => {
  return (
    <Collapse accordion>
      {faqs.map((faq) => {
        const helpfulnessScore = calculateHelpfulnessScore(faq.helpful, faq.notHelpful);

        return (
          <Panel
            header={
              <Space>
                <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                <Text strong>{faq.question}</Text>
              </Space>
            }
            key={faq.id}
            extra={
              <Space size={8} onClick={(e) => e.stopPropagation()}>
                <Tag color="blue" style={{ fontSize: 11 }}>
                  {getCategoryLabel(faq.category)}
                </Tag>
                {helpfulnessScore > 0 && (
                  <Tag color="success" style={{ fontSize: 11 }}>
                    <LikeOutlined /> {helpfulnessScore}%
                  </Tag>
                )}
              </Space>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <ReactMarkdown>{faq.answer}</ReactMarkdown>
            </div>

            {faq.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
                  Tags:
                </Text>
                <Space size={4} wrap>
                  {faq.tags.map((tag) => (
                    <Tag key={tag} style={{ fontSize: 11 }}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {onFeedback && (
              <div>
                <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
                  Was this helpful?
                </Text>
                <Space>
                  <Button
                    size="small"
                    icon={<LikeOutlined />}
                    onClick={() => onFeedback(faq.id, true)}
                  >
                    Yes ({faq.helpful})
                  </Button>
                  <Button
                    size="small"
                    icon={<DislikeOutlined />}
                    onClick={() => onFeedback(faq.id, false)}
                  >
                    No ({faq.notHelpful})
                  </Button>
                </Space>
              </div>
            )}
          </Panel>
        );
      })}
    </Collapse>
  );
};

export default FAQList;
