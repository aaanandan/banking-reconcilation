import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Tabs, Input, Select, Space, Typography, Statistic, Empty, Spin } from 'antd';
import {
  QuestionCircleOutlined,
  SearchOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { HelpArticleCard } from './HelpArticleCard';
import { FAQList } from './FAQList';
import { GettingStartedCard } from './GettingStartedCard';
import {
  HelpArticle,
  FAQ,
  VideoTutorial,
  GettingStartedGuide,
  HelpCategory,
  ArticleDifficulty,
  searchArticles,
  searchFAQs,
  filterArticlesByCategory,
  filterArticlesByDifficulty,
  sortArticles,
  calculateHelpStats,
  HELP_CATEGORIES,
  getCategoryLabel,
  getDifficultyLabel,
} from '../../utils/helpUtils';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface HelpCenterProps {
  articles: HelpArticle[];
  faqs: FAQ[];
  videos: VideoTutorial[];
  guides: GettingStartedGuide[];
  loading?: boolean;
  onViewArticle?: (articleId: string) => void;
  onViewVideo?: (videoId: string) => void;
  onFAQFeedback?: (faqId: string, helpful: boolean) => void;
  onGuideStepToggle?: (guideId: string, stepId: string, completed: boolean) => void;
}

/**
 * Main help center component
 */
export const HelpCenter: React.FC<HelpCenterProps> = ({
  articles,
  faqs,
  videos,
  guides,
  loading = false,
  onViewArticle,
  onViewVideo,
  onFAQFeedback,
  onGuideStepToggle,
}) => {
  const [activeTab, setActiveTab] = useState('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<ArticleDifficulty | null>(null);
  const [sortField, setSortField] = useState<'title' | 'views' | 'helpful' | 'lastUpdated'>('views');

  const filteredArticles = useMemo(() => {
    let result = articles;

    // Search
    if (searchQuery) {
      result = searchArticles(result, searchQuery);
    }

    // Filter by category
    if (selectedCategory) {
      result = filterArticlesByCategory(result, selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      result = filterArticlesByDifficulty(result, selectedDifficulty);
    }

    // Sort
    result = sortArticles(result, sortField, 'desc');

    return result;
  }, [articles, searchQuery, selectedCategory, selectedDifficulty, sortField]);

  const filteredFAQs = useMemo(() => {
    let result = faqs;

    // Search
    if (searchQuery) {
      result = searchFAQs(result, searchQuery);
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((faq) => faq.category === selectedCategory);
    }

    // Sort by order
    result = [...result].sort((a, b) => a.order - b.order);

    return result;
  }, [faqs, searchQuery, selectedCategory]);

  const filteredVideos = useMemo(() => {
    let result = videos;

    // Search
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (video) =>
          video.title.toLowerCase().includes(queryLower) ||
          video.description.toLowerCase().includes(queryLower)
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((video) => video.category === selectedCategory);
    }

    return result;
  }, [videos, searchQuery, selectedCategory]);

  const stats = useMemo(() => calculateHelpStats(articles, faqs, videos), [articles, faqs, videos]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
  };

  return (
    <div>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <QuestionCircleOutlined style={{ marginRight: 8 }} />
          Help Center
        </Title>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Help Articles"
              value={stats.totalArticles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="FAQs"
              value={stats.totalFAQs}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Video Tutorials"
              value={stats.totalVideos}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%' }} wrap>
          <Input
            placeholder="Search help articles, FAQs, videos..."
            prefix={<SearchOutlined />}
            style={{ width: 400 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />

          <Select
            placeholder="All categories"
            style={{ width: 200 }}
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
            options={HELP_CATEGORIES.map((cat) => ({
              label: cat.label,
              value: cat.category,
            }))}
          />

          {activeTab === 'articles' && (
            <>
              <Select
                placeholder="All difficulties"
                style={{ width: 150 }}
                value={selectedDifficulty}
                onChange={setSelectedDifficulty}
                allowClear
                options={Object.values(ArticleDifficulty).map((diff) => ({
                  label: getDifficultyLabel(diff),
                  value: diff,
                }))}
              />

              <Select
                placeholder="Sort by"
                style={{ width: 150 }}
                value={sortField}
                onChange={setSortField}
                options={[
                  { label: 'Most Viewed', value: 'views' },
                  { label: 'Most Helpful', value: 'helpful' },
                  { label: 'Recently Updated', value: 'lastUpdated' },
                  { label: 'Title', value: 'title' },
                ]}
              />
            </>
          )}

          {(searchQuery || selectedCategory || selectedDifficulty) && (
            <a onClick={handleClearFilters}>Clear filters</a>
          )}
        </Space>
      </Card>

      {/* Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Getting Started Tab */}
          <TabPane
            tab={
              <span>
                <RocketOutlined />
                Getting Started ({guides.length})
              </span>
            }
            key="getting-started"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" tip="Loading guides..." />
              </div>
            ) : guides.length === 0 ? (
              <Empty description="No getting started guides available" />
            ) : (
              <Row gutter={[16, 16]}>
                {guides.map((guide) => (
                  <Col span={24} key={guide.id}>
                    <GettingStartedCard guide={guide} onStepToggle={onGuideStepToggle} />
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>

          {/* Articles Tab */}
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Articles ({filteredArticles.length})
              </span>
            }
            key="articles"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" tip="Loading articles..." />
              </div>
            ) : filteredArticles.length === 0 ? (
              <Empty description="No articles found" />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredArticles.map((article) => (
                  <Col span={12} key={article.id}>
                    <HelpArticleCard
                      article={article}
                      onView={onViewArticle || (() => {})}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>

          {/* FAQs Tab */}
          <TabPane
            tab={
              <span>
                <QuestionCircleOutlined />
                FAQs ({filteredFAQs.length})
              </span>
            }
            key="faqs"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" tip="Loading FAQs..." />
              </div>
            ) : filteredFAQs.length === 0 ? (
              <Empty description="No FAQs found" />
            ) : (
              <FAQList faqs={filteredFAQs} onFeedback={onFAQFeedback} />
            )}
          </TabPane>

          {/* Videos Tab */}
          <TabPane
            tab={
              <span>
                <VideoCameraOutlined />
                Video Tutorials ({filteredVideos.length})
              </span>
            }
            key="videos"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" tip="Loading videos..." />
              </div>
            ) : filteredVideos.length === 0 ? (
              <Empty description="No videos found" />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredVideos.map((video) => (
                  <Col span={8} key={video.id}>
                    <Card
                      size="small"
                      hoverable
                      cover={
                        <div
                          style={{
                            height: 150,
                            background: `url(${video.thumbnailUrl}) center/cover`,
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                            }}
                          >
                            {Math.floor(video.duration / 60)}:
                            {(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      }
                      onClick={() => onViewVideo?.(video.id)}
                    >
                      <Card.Meta
                        title={video.title}
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                              {video.description}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {video.views} views
                            </Text>
                          </Space>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default HelpCenter;
