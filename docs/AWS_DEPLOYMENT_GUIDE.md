# ☁️ Student Knowledge AI — Complete AWS Deployment Guide

This guide provides step-by-step instructions for deploying the **Student Knowledge AI** full-stack RAG platform to Amazon Web Services (AWS).

---

## 📋 Table of Contents

1. [Deployment Architectures](#1-deployment-architectures)
2. [Production Environment Variables](#2-production-environment-variables)
3. [Option A: Low-Cost EC2 Docker Compose Deployment](#3-option-a-low-cost-ec2-docker-compose-deployment)
4. [Option B: AWS App Runner + S3 + CloudFront (Serverless Containers)](#4-option-b-aws-app-runner--s3--cloudfront-serverless-containers)
5. [Option C: Enterprise AWS ECS Fargate + RDS PostgreSQL](#5-option-c-enterprise-aws-ecs-fargate--rds-postgresql)
6. [Post-Deployment Verification & Troubleshooting](#6-post-deployment-verification--troubleshooting)

---

## 1. Deployment Architectures

You can deploy the system using one of three strategies:

| Strategy | Target Use Case | Estimated Cost | Setup Effort |
| :--- | :--- | :--- | :--- |
| **Option A: EC2 Docker Compose** | Demos, Staging, Low Traffic | ~$15 - $30 / month | Low (15 mins) |
| **Option B: AWS App Runner + S3** | Auto-scaling API, Managed Containers | Pay-per-use (~$5 - $25/mo) | Medium (20 mins) |
| **Option C: ECS Fargate + RDS** | Enterprise High Availability | ~$60 - $120 / month | High (45 mins) |

---

## 2. Production Environment Variables

Prepare these environment variables before running any deployment script:

```ini
# Core Settings
ENVIRONMENT=production
PROJECT_NAME="Student Knowledge AI"
LOG_LEVEL=INFO

# Security Tokens (Generate random 64-char strings)
JWT_SECRET=c1c8185bd7c00f12631e4241bd110b5334929569e1835a5873890c2f8bbc1ea2
JWT_REFRESH_SECRET=E5NLt_aS5aHuOy6uDsRfv3ENW4wTHrtAiybLnVA_YZMN0t5dTDnds-_IGDTxAuvkxMFLmg3FldjfjAAE18Y3VQ
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Database Connection (AWS RDS or Supabase PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:<password>@<rds-endpoint>:5432/student_rag

# Vector Database (Qdrant Cloud)
QDRANT_URL=https://<cluster-id>.<region>.aws.cloud.qdrant.io
QDRANT_COLLECTION_NAME=student_notes
QDRANT_API_KEY=<your-qdrant-api-key>

# LLM Provider
GROQ_API_KEY=<your-groq-api-key>
LLM_MODEL=llama-3.3-70b-versatile

# RAG Similarity Guardrail Cutoff
SCORE_THRESHOLD=0.18

# Storage Configuration
STORAGE_TYPE=supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_KEY=<your-supabase-service-role-key>
SUPABASE_BUCKET=notes

# CORS Allowed Origin
FRONTEND_ORIGIN=https://yourdomain.com
```

---

## 3. Option A: Low-Cost EC2 Docker Compose Deployment

Runs the entire stack (FastAPI Backend, Nginx Frontend, PostgreSQL DB, and Qdrant) inside a single EC2 instance using `docker-compose.yml`.

### Step 1: Launch an AWS EC2 Instance
1. Log in to **AWS Management Console** ➔ Open **EC2 Dashboard**.
2. Click **Launch Instance**.
3. **Name**: `student-knowledge-ai-server`
4. **AMI**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS.
5. **Instance Type**: `t3.medium` (2 vCPU, 4 GiB RAM) or `t3.large`.
6. **Key Pair**: Select or create a `.pem` SSH key pair.
7. **Network Settings (Security Group)**:
   - Allow **SSH (Port 22)** from `My IP`.
   - Allow **HTTP (Port 80)** from `0.0.0.0/0`.
   - Allow **HTTPS (Port 443)** from `0.0.0.0/0`.
8. **Storage**: Set root volume to **20 GB gp3 SSD**.
9. Click **Launch Instance**.

### Step 2: SSH into EC2 & Install Docker
Connect to your EC2 instance via SSH:
```bash
ssh -i key.pem ubuntu@<ec2-public-ip>
```

Execute host configuration script:
```bash
# Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
sudo apt install -y docker.io docker-compose git curl

# Enable Docker service for non-root user
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 3: Clone Repository & Configure Environment
```bash
# Clone the repository
git clone https://github.com/Neminath-jain/AI-Powered-Study-Notes-RAG-API.git
cd AI-Powered-Study-Notes-RAG-API

# Create production .env file
nano .env
```
Paste your production environment variables into `.env` and save (`Ctrl+O`, `Enter`, `Ctrl+X`).

### Step 4: Build & Launch Docker Containers
```bash
# Build images and start containers in background
docker-compose up -d --build

# Verify container status
docker-compose ps

# Check backend logs
docker-compose logs -f api
```

### Step 5: Setup Free SSL Certificate with Certbot (Optional but Recommended)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 4. Option B: AWS App Runner + S3 + CloudFront (Serverless Containers)

Automatically scales your FastAPI backend on demand without needing server administration.

### Step 1: Push Backend Container to Amazon ECR
```bash
# Set AWS Account variables
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="123456789012"

# 1. Log in to Amazon ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 2. Create ECR repository
aws ecr create-repository --repository-name student-rag-api --region $AWS_REGION

# 3. Build & Tag Docker image
docker build -t student-rag-api -f Dockerfile .
docker tag student-rag-api:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/student-rag-api:latest

# 4. Push image to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/student-rag-api:latest
```

### Step 2: Create AWS App Runner Service
1. Navigate to **AWS App Runner** in AWS Console.
2. Click **Create Service**.
3. **Repository Type**: Container registry ➔ Select **Amazon ECR**.
4. **Image URI**: Browse and select `student-rag-api:latest`.
5. **Deployment Trigger**: Automatic (deploys automatically when new ECR image is pushed).
6. **Service Settings**:
   - **Service Name**: `student-knowledge-ai-api`
   - **CPU**: `1 vCPU`, **Memory**: `2 GB`
   - **Port**: `8000`
7. **Environment Variables**: Add key-value pairs (`DATABASE_URL`, `QDRANT_URL`, `GROQ_API_KEY`, etc.).
8. Click **Create & Deploy**.
9. Once deployed, note down the generated URL: `https://xxxx.ap-south-1.awsapprunner.com`.

### Step 3: Deploy React Frontend to S3 & CloudFront
1. Build frontend dist bundle pointing to your App Runner API URL:
   ```bash
   cd frontend
   VITE_API_BASE_URL=https://xxxx.ap-south-1.awsapprunner.com/api/v1 npm run build
   ```
2. Create an **S3 Bucket** named `student-knowledge-ai-frontend`.
3. Sync static files to S3:
   ```bash
   aws s3 sync dist/ s3://student-knowledge-ai-frontend --delete
   ```
4. Create a **CloudFront Distribution** pointing to your S3 bucket origin with `index.html` error fallback for SPA routing.

---

## 5. Option C: Enterprise AWS ECS Fargate + RDS PostgreSQL

Production multi-AZ container architecture with high availability.

```
┌────────────────────────────────────────────────────────┐
│               Route 53 / AWS CloudFront                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Application Load Balancer (ALB)             │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│     ECS Fargate Task 1       ││     ECS Fargate Task 2       │
│  FastAPI Backend Container   ││  FastAPI Backend Container   │
└──────────────┬───────────────┘└──────────────┬───────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│     AWS RDS PostgreSQL       ││         Qdrant Cloud         │
│  (User / Session Metadata)   ││   (Dense Vector Indexes)     │
└──────────────────────────────┘└──────────────────────────────┘
```

### Step 1: Provision AWS RDS PostgreSQL
1. Open **AWS RDS Console** ➔ **Create Database**.
2. **Engine**: PostgreSQL (v16).
3. **Template**: Free tier / Production.
4. **DB Instance Identifier**: `student-rag-db`.
5. **Master Credentials**: Set username `postgres` and password.
6. **Instance Configuration**: `db.t4g.micro` or `db.t4g.small`.
7. **Connectivity**: Attach security group allowing inbound port `5432` from your ECS tasks.

### Step 2: Create ECS Fargate Task Definition
1. Open **Amazon ECS** ➔ **Task Definitions** ➔ **Create new Task Definition**.
2. **Launch Type**: AWS Fargate.
3. **Task Size**: 1 vCPU, 2 GB Memory.
4. **Container Definition**:
   - **Image**: `<aws_account_id>.dkr.ecr.<region>.amazonaws.com/student-rag-api:latest`
   - **Port mappings**: `8000` (TCP)
   - **Environment Variables / Secrets**: Map DB credentials and API keys via AWS Secrets Manager.

### Step 3: Run Database Migrations
From your deployment machine or a temporary ECS task, execute Alembic migrations:
```bash
alembic -c backend/alembic.ini upgrade head
```

---

## 6. Post-Deployment Verification & Troubleshooting

### 1. Health Probe Verification
Verify system infrastructure components by requesting the health endpoint:
```bash
curl -i https://<your-api-domain>/api/v1/health
```
**Expected Response (`200 OK`):**
```json
{
  "status": "ok",
  "database": "connected",
  "qdrant": "connected"
}
```

### 2. Common Issues & Solutions

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **`CORS Policy Error` in browser** | `FRONTEND_ORIGIN` mismatched | Set `FRONTEND_ORIGIN=https://yourdomain.com` in backend env variables |
| **`HTTP 503 Database Error`** | RDS Security Group blocking ECS/EC2 | Add inbound rule on Port 5432 for ECS task security group |
| **`I cannot find this information...`** | Similarity threshold cutoff | Ensure `SCORE_THRESHOLD` is set to `0.18` |
| **`PDF Upload 413 Payload Too Large`** | Nginx request size limit | Add `client_max_body_size 50M;` to Nginx config |
