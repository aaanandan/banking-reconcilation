# Step 227: Deploy ELK Stack (Elasticsearch, Logstash, Kibana)

## Overview

Deploy the complete ELK Stack for centralized logging, log aggregation, and log analysis across all microservices.

## Architecture

```
Services → Filebeat → Logstash → Elasticsearch → Kibana
            (collect)  (process)   (store)        (visualize)
```

## ELK Stack Configuration

### Already Configured in docker-compose.yml

The ELK stack is already defined in `docker-compose.yml`:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - monitoring

  logstash:
    image: docker.elastic.co/logstash/logstash:8.13.0
    container_name: logstash
    volumes:
      - ./monitoring/elk/logstash/pipeline:/usr/share/logstash/pipeline
      - ./monitoring/elk/logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
    ports:
      - "5044:5044"
      - "9600:9600"
    depends_on:
      - elasticsearch
    networks:
      - monitoring

  kibana:
    image: docker.elastic.co/kibana/kibana:8.13.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - monitoring

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.13.0
    container_name: filebeat
    user: root
    volumes:
      - ./monitoring/elk/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - elasticsearch
      - logstash
    networks:
      - monitoring
```

## Detailed Component Configuration

### 1. Logstash Pipeline Configuration

Already created in `monitoring/elk/logstash/pipeline/logstash.conf`:

```ruby
input {
  beats {
    port => 5044
  }
}

filter {
  # Parse JSON logs
  if [message] =~ /^\{.*\}$/ {
    json {
      source => "message"
      target => "log"
    }
  }

  # Extract service name from Docker labels
  if [container][labels][com.docker.compose.service] {
    mutate {
      add_field => { "service" => "%{[container][labels][com.docker.compose.service]}" }
    }
  }

  # Parse timestamp
  date {
    match => [ "[log][timestamp]", "ISO8601" ]
    target => "@timestamp"
  }

  # Extract log level
  if [log][level] {
    mutate {
      add_field => { "level" => "%{[log][level]}" }
    }
  }

  # Extract tenant ID
  if [log][tenantId] {
    mutate {
      add_field => { "tenant_id" => "%{[log][tenantId]}" }
    }
  }

  # Extract request ID for tracing
  if [log][requestId] {
    mutate {
      add_field => { "request_id" => "%{[log][requestId]}" }
    }
  }

  # Parse error stack traces
  if [log][stack] {
    mutate {
      add_field => { "error_stack" => "%{[log][stack]}" }
    }
  }

  # Classify log severity
  if [level] == "error" or [level] == "fatal" {
    mutate {
      add_field => { "severity" => "high" }
    }
  } else if [level] == "warn" {
    mutate {
      add_field => { "severity" => "medium" }
    }
  } else {
    mutate {
      add_field => { "severity" => "low" }
    }
  }

  # Remove unnecessary fields
  mutate {
    remove_field => [ "agent", "ecs", "input", "host" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{service}-%{+YYYY.MM.dd}"
  }

  # Debug output (optional)
  # stdout { codec => rubydebug }
}
```

### 2. Logstash Main Configuration

Create `monitoring/elk/logstash/config/logstash.yml`:

```yaml
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
path.config: /usr/share/logstash/pipeline
```

### 3. Filebeat Configuration

Already created in `monitoring/elk/filebeat/filebeat.yml`:

```yaml
filebeat.autodiscover:
  providers:
    - type: docker
      hints.enabled: true
      templates:
        - condition:
            contains:
              docker.container.name: "auth-service"
          config:
            - type: container
              paths:
                - '/var/lib/docker/containers/${data.docker.container.id}/*.log'
              json.keys_under_root: true
              json.add_error_key: true
              fields:
                service: auth-service
                
        - condition:
            contains:
              docker.container.name: "billing-service"
          config:
            - type: container
              paths:
                - '/var/lib/docker/containers/${data.docker.container.id}/*.log'
              json.keys_under_root: true
              fields:
                service: billing-service

processors:
  - add_cloud_metadata: ~
  - add_docker_metadata: ~

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

## Service-Level Log Configuration

### JSON Structured Logging Format

All services should log in JSON format for easy parsing:

```javascript
// Example: Auth Service Logging
const logger = {
  info: (message, metadata = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'auth-service',
      message,
      ...metadata,
      requestId: metadata.requestId || generateRequestId(),
      tenantId: metadata.tenantId || null,
    }));
  },
  
  error: (message, error, metadata = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'auth-service',
      message,
      error: error.message,
      stack: error.stack,
      ...metadata,
    }));
  },
  
  warn: (message, metadata = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      service: 'auth-service',
      message,
      ...metadata,
    }));
  },
};

// Usage
logger.info('User login successful', { 
  userId: user.id, 
  tenantId: user.tenantId,
  requestId: req.id 
});

logger.error('Database connection failed', error, { 
  tenantId: 'tenant_123' 
});
```

## Index Lifecycle Management

### 1. Create Index Template

```bash
# Create index template for application logs
curl -X PUT "localhost:9200/_index_template/logs-template" \
  -H 'Content-Type: application/json' \
  -d '{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "logs-policy",
      "index.lifecycle.rollover_alias": "logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "service": { "type": "keyword" },
        "message": { "type": "text" },
        "tenant_id": { "type": "keyword" },
        "request_id": { "type": "keyword" },
        "severity": { "type": "keyword" },
        "error_stack": { "type": "text" }
      }
    }
  }
}'
```

### 2. Create Lifecycle Policy

```bash
# Auto-delete logs older than 30 days
curl -X PUT "localhost:9200/_ilm/policy/logs-policy" \
  -H 'Content-Type: application/json' \
  -d '{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_size": "50gb"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'
```

## Starting the ELK Stack

```bash
# Start all ELK components
docker-compose up -d elasticsearch logstash kibana filebeat

# Verify all services are running
docker-compose ps | grep -E "elasticsearch|logstash|kibana|filebeat"

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# Check Logstash is receiving data
curl http://localhost:9600/_node/stats?pretty

# Access Kibana UI
open http://localhost:5601
```

## Verification

### 1. Check Data Ingestion

```bash
# Check if indices are being created
curl http://localhost:9200/_cat/indices?v

# View recent logs
curl http://localhost:9200/logs-*/_search?size=5&pretty

# Count logs by service
curl -X GET "localhost:9200/logs-*/_search?size=0&pretty" \
  -H 'Content-Type: application/json' \
  -d '{
  "aggs": {
    "services": {
      "terms": {
        "field": "service"
      }
    }
  }
}'
```

### 2. Test Log Flow

```bash
# Generate test logs from auth service
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Check if logs appear in Elasticsearch (wait 10 seconds)
sleep 10
curl "localhost:9200/logs-auth-service-*/_search?q=login&pretty"
```

## Performance Tuning

### Elasticsearch Memory Settings

```yaml
# In docker-compose.yml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms2g -Xmx2g"  # Increase for production
```

### Logstash Workers

```yaml
# In logstash.yml
pipeline.workers: 2
pipeline.batch.size: 125
pipeline.batch.delay: 50
```

## Troubleshooting

### Elasticsearch Won't Start

```bash
# Check logs
docker logs elasticsearch

# Common issues:
# 1. Insufficient memory
# 2. Port 9200 already in use
# 3. Volume permissions
```

### No Logs in Elasticsearch

```bash
# Check Filebeat is collecting logs
docker logs filebeat

# Check Logstash is processing
docker logs logstash

# Verify Filebeat → Logstash connection
docker exec filebeat filebeat test output
```

### Kibana Connection Issues

```bash
# Check Kibana can reach Elasticsearch
docker logs kibana

# Test connection manually
docker exec kibana curl http://elasticsearch:9200
```

## Next Steps

- **Step 228**: Configure log forwarding from all services
- **Step 229**: Create Kibana dashboards and visualizations
- **Step 230**: Set up Sentry for error tracking

## Resources

- Elastic Stack Documentation: https://www.elastic.co/guide/index.html
- Filebeat Reference: https://www.elastic.co/guide/en/beats/filebeat/current/index.html
- Logstash Reference: https://www.elastic.co/guide/en/logstash/current/index.html

---

**Status**: ✅ ELK Stack deployed and configured  
**Next**: Step 228 - Configure Log Forwarding
