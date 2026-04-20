import React from 'react';
import { Card, Space, Tag, Typography, Button } from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';
import {
  HelpArticle,
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
  calculateHelpfulnessScore,
} from '../../utils/helpUtils';

const { Text, Paragraph } = Typography;

interface HelpArticleCardProps {
  article: HelpArticle;
  onView: (articleId: string) => void;
}

/**
 * Help article card component
 */
export const HelpArticleCard: React.FC<HelpArticleCardProps> = ({ article, onView }) => {
  const helpfulnessScore = calculateHelpfulnessScore(article.helpful, article.notHelpful);

  return (
    <Card
      size="small"
      hoverable
      onClick={() => onView(article.id)}
      style={{ cursor: 'pointer' }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* Title and Tags */}
        <div>
          <Space style={{ marginBottom: 8 }} wrap>
            <FileTextOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              {article.title}
            </Text>
          </Space>
          <div>
            <Space size={4} wrap>
              <Tag color="blue">{getCategoryLabel(article.category)}</Tag>
              <Tag color={getDifficultyColor(article.difficulty)}>
                {getDifficultyLabel(article.difficulty)}
              </Tag>
              {article.tags.slice(0, 3).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>
        </div>

        {/* Summary */}
        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
          {article.summary}
        </Paragraph>

        {/* Metadata */}
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>} wrap>
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {article.estimatedReadTime} min read
            </Text>
          </Space>

          <Space size={4}>
            <EyeOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {article.views} views
            </Text>
          </Space>

          <Space size={4}>
            <LikeOutlined style={{ color: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {helpfulnessScore}% helpful
            </Text>
          </Space>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Updated {new Date(article.lastUpdated).toLocaleDateString()}
          </Text>
        </Space>

        {/* Action */}
        <Button
          type="link"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onView(article.id);
          }}
          style={{ padding: 0 }}
        >
          Read Article →
        </Button>
      </Space>
    </Card>
  );
};

export default HelpArticleCard;
