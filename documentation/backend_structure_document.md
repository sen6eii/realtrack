# Realtrack Backend Structure Document

This document outlines the complete backend setup for the Realtrack project. It is written in everyday language so that anyone—technical or non-technical—can understand how the backend is organized, hosted, and maintained.

## 1. Backend Architecture

**Overall Design**
- We use a **modular microservices architecture**. Each core function (authentication, data ingestion, real-time streaming, reporting, notifications, etc.) lives in its own service.
- Services communicate through a **message broker** (e.g., Kafka or RabbitMQ) for reliable, asynchronous data flows.
- A central **API gateway** handles incoming client requests, routes them to the correct service, and enforces security rules.
- Real-time updates use **WebSockets** (e.g., Socket.io) so the frontend sees live tracking data with minimal delay.

**How It Scales, Stays Maintainable, and Performs**
- **Scalability**: Each service can be scaled independently to meet demand. Containerization (Docker) and orchestration (Kubernetes or AWS ECS/EKS) ensure we can spin up more instances as needed.
- **Maintainability**: Clear separation of services, well-defined interfaces, and standardized coding patterns make it easy to add features or fix bugs without breaking unrelated parts.
- **Performance**: Asynchronous processing via the message broker, in-memory caching for hot data, and a content delivery network (CDN) for static assets all help keep response times low.

## 2. Database Management

**Technologies Used**
- SQL Database: PostgreSQL with the PostGIS extension for spatial queries.
- NoSQL Database: MongoDB (optional) for storing unstructured data like audit logs or raw telemetry.
- In-memory Cache: Redis for fast lookups (e.g., session data, rate limits).

**Data Storage and Access**
- **Spatial data** (latitude/longitude) lives in PostGIS so we can run efficient location queries and geofencing checks.
- **Time-series data** (tracks, speed, timestamps) is organized with appropriate indexes to support range queries and aggregation.
- **Unstructured logs** and large JSON documents (e.g., raw telemetry dumps) can go into MongoDB so we don’t bloat the relational store.
- Access is controlled via service-level credentials. Applications only get the permissions they need (least privilege).

**Data Management Practices**
- Regular automated backups of PostgreSQL and MongoDB.
- Retention policies archive or purge old tracking data to manage storage costs.
- Transactional integrity ensured by relational ACID guarantees for critical operations (e.g., user management, billing).

## 3. Database Schema

Below is a human-readable overview of the main tables in PostgreSQL (with PostGIS) and then an example SQL schema.

**Human-Readable Schema**
- **Users**: Stores user credentials, profile info, and roles.
- **Roles**: Defines different permission levels (admin, user, viewer).
- **Projects**: Represents a tracking project, its settings, and its members.
- **Assets**: Physical entities being tracked (vehicles, devices), linked to projects.
- **Tracks**: Time-stamped position records for each asset, stored as geographically indexed points.
- **Alerts**: Rules that trigger notifications when assets cross zones or thresholds.
- **Notifications**: Records of alert events sent via email, webhook, or in-app.

**Example SQL Schema (PostgreSQL/PostGIS)**
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INT REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tracks (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),
  recorded_at TIMESTAMP NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  speed NUMERIC,
  additional_data JSONB
);

CREATE INDEX ON tracks USING GIST(location);
CREATE INDEX ON tracks(recorded_at);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  rule JSONB,        -- e.g., zone polygons, speed thresholds
  delivery_channels TEXT[]
);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  alert_id INT REFERENCES alerts(id),
  asset_id UUID REFERENCES assets(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  status TEXT,       -- sent, failed, pending
  payload JSONB
);
```

## 4. API Design and Endpoints

**Approach**
- We use **RESTful** conventions for simplicity and broad compatibility.
- All endpoints are versioned (e.g., `/api/v1/...`) to support future upgrades.
- JSON is the standard request/response format.

**Key Endpoints**
- **Authentication**
  - `POST /api/v1/auth/register` — Create a new user.
  - `POST /api/v1/auth/login` — Obtain a JSON Web Token (JWT).
  - `POST /api/v1/auth/refresh` — Refresh an expiring token.

- **Projects & Assets**
  - `GET /api/v1/projects` — List your projects.
  - `POST /api/v1/projects` — Create a project.
  - `GET /api/v1/projects/{id}` — Project details.
  - `GET /api/v1/projects/{id}/assets` — List assets in a project.
  - `POST /api/v1/projects/{id}/assets` — Add a new asset.

- **Tracks**
  - `POST /api/v1/tracks` — Bulk upload of tracked points.
  - `GET /api/v1/assets/{id}/tracks?start=&end=` — Query historical tracks.

- **Real-Time**
  - WebSocket endpoint: `wss://backend.example.com/stream` — Subscribe to live updates for selected assets.

- **Alerts & Notifications**
  - `GET /api/v1/alerts` — List alert rules.
  - `POST /api/v1/alerts` — Create or update a rule.
  - `GET /api/v1/notifications` — View recent notifications.

- **Reporting & Exports**
  - `GET /api/v1/reports/summary` — Dashboard metrics (distance, speed, dwell time).
  - `POST /api/v1/exports` — Schedule an export (CSV, GeoJSON, KML).
  - `GET /api/v1/exports/{id}` — Download a completed export.

## 5. Hosting Solutions

**Cloud Provider**: AWS
- **Compute**: Elastic Kubernetes Service (EKS) or Elastic Container Service (ECS) running Docker containers.
- **Database**: Amazon RDS for PostgreSQL (with PostGIS) and Amazon DocumentDB or self-managed MongoDB on EC2.
- **Cache**: Amazon ElastiCache (Redis).
- **Storage**: S3 for raw telemetry uploads, export files, and static assets.

**Why AWS?**
- **Reliability**: SLA-backed services with built-in replication and automatic failover.
- **Scalability**: Auto scaling groups, managed container services, and serverless options let us grow on demand.
- **Cost-effectiveness**: Pay-as-you-go pricing, spot instances for batch jobs, and tiered storage in S3.

## 6. Infrastructure Components

- **Load Balancer**: AWS Application Load Balancer (ALB) to distribute incoming HTTP/WebSocket traffic across service instances.
- **CDN**: Amazon CloudFront for caching static assets at edge locations worldwide.
- **Message Broker**: Kafka cluster (self-managed on EC2 or via MSK) or RabbitMQ for event streaming between services.
- **Secrets Management**: AWS Secrets Manager or HashiCorp Vault to store credentials, API keys, and certificates.
- **Container Registry**: Amazon ECR for storing Docker images.
- **Logging & Tracing**: Centralized logs in AWS CloudWatch or an ELK (Elasticsearch, Logstash, Kibana) stack; distributed tracing with OpenTelemetry.

## 7. Security Measures

- **Authentication**: JWT tokens, short-lived access tokens, and refresh tokens.
- **Authorization**: Role-based access control (RBAC) enforced at the API gateway and service layers.
- **Data Encryption**:
  - In transit: TLS/HTTPS everywhere.
  - At rest: AWS-managed encryption for RDS, S3, ElastiCache.
- **Network Security**: Private VPCs, security groups, and network ACLs to restrict traffic.
- **Input Validation**: Sanitize all incoming data to prevent injection attacks.
- **Auditing & Compliance**: Audit logs for all security-relevant actions; periodic penetration testing and vulnerability scanning.

## 8. Monitoring and Maintenance

- **Performance Monitoring**: Prometheus + Grafana dashboards for real-time metrics (CPU, memory, latency).
- **Health Checks**: Kubernetes/ECS liveness and readiness probes to automatically restart unhealthy containers.
- **Alerting**: CloudWatch or Prometheus Alertmanager sends notifications (email, Slack) when thresholds are breached.
- **CI/CD Pipeline**: GitHub Actions or AWS CodePipeline to run tests, build containers, and deploy to staging/production.
- **Backup & Restore**: Automated daily snapshots of RDS and MongoDB; S3 lifecycle rules to archive old exports.
- **Maintenance Windows**: Scheduled windows for major upgrades, with rolling deployments to avoid downtime.

## 9. Conclusion and Overall Backend Summary

Realtrack’s backend is built to handle high-volume, geospatial tracking data in real time. By using a microservices architecture, managed database services, and cloud-native infrastructure, we ensure:
- **Scalability**: Grow seamlessly as more assets and users come online.
- **Reliability**: Redundant services, automated failover, and health checks keep the system available.
- **Maintainability**: Modular code, clear interfaces, and standardized workflows make updates safe and predictable.
- **Performance**: In-memory caching, CDNs, and efficient spatial indexing keep user experiences snappy.

Together, these components form a robust and cost-effective backend that meets Realtrack’s goals of secure, real-time asset tracking, insightful reporting, and easy integration with other systems.