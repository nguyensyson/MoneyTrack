# MoneyTrack

Ứng dụng quản lý tài chính cá nhân — theo dõi thu nhập, chi tiêu và phân tích thống kê theo danh mục.

## Mục lục

- [Giới thiệu](#1-giới-thiệu)
- [Tech Stack](#2-tech-stack)
- [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
- [Biến môi trường](#4-biến-môi-trường)
- [Chạy local](#5-chạy-local)
- [Deploy hạ tầng AWS bằng Terraform](#6-deploy-hạ-tầng-aws-bằng-terraform)
- [Thao tác thủ công trên AWS Console](#7-thao-tác-thủ-công-trên-aws-console)
- [CI/CD với GitHub Actions](#8-cicd-với-github-actions)
- [Ghi chú về DynamoDB](#9-ghi-chú-về-dynamodb)
- [Troubleshooting](#10-troubleshooting)

---

## 1. Giới thiệu

**MoneyTrack** là ứng dụng quản lý tài chính cá nhân cho phép người dùng ghi lại, phân loại và phân tích thu nhập và chi tiêu của mình.

### Tính năng chính

- Đăng ký / đăng nhập với phân quyền `USER` và `ADMIN`
- Quản lý giao dịch: tạo, xem, lọc thu nhập và chi tiêu
- Quản lý danh mục phân cấp (cha / con) theo loại `INCOME` hoặc `EXPENSE`
- Dashboard thống kê: tổng hợp theo tháng, số dư, chi tiêu theo danh mục
- Admin panel: quản lý danh mục và xem dữ liệu toàn hệ thống

### Kiến trúc tổng quan

```
                        ┌─────────────────────────────────────────────┐
                        │                   AWS Cloud                  │
                        │                                              │
  User ──► CloudFront ──► S3 (static)   Amplify (Next.js build)       │
                        │                                              │
  User ──► Route 53 ──► Global Accelerator ──► ALB ──► ECS Fargate    │
                        │                              (Spring Boot)   │
                        │                                    │         │
                        │                              DynamoDB        │
                        │                         (Global Tables)      │
                        └─────────────────────────────────────────────┘

  CI/CD: GitHub Actions ──► ECR (Docker image) ──► ECS deploy
                       └──► Amplify (frontend build trigger)
```

---

## 2. Tech Stack

| Layer | Công nghệ |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, pnpm |
| **Backend** | Spring Boot 3.3.5, Java 17, Maven, Spring Security, JWT (jjwt 0.12.6) |
| **Database** | Amazon DynamoDB (AWS SDK v2 + Enhanced Client) |
| **Container** | Docker (multi-stage build), Amazon ECR |
| **Orchestration** | Amazon ECS Fargate, Application Load Balancer, Global Accelerator |
| **Frontend hosting** | AWS Amplify, Amazon CloudFront, Amazon S3 |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions (OIDC auth — không dùng long-lived AWS keys) |
| **Monitoring** | Amazon CloudWatch, SNS Alerts |
| **Security** | AWS Secrets Manager (JWT secret), IAM Roles, WAF |

---

## 3. Cấu trúc thư mục

```
MoneyTrack/
├── MoneyTrack_BE/          # Spring Boot backend
│   ├── src/
│   │   ├── main/java/      # Source code chính
│   │   └── test/java/      # Unit tests + property-based tests (jqwik)
│   ├── Dockerfile          # Multi-stage build (deps → builder → runtime)
│   ├── docker-compose.yml  # DynamoDB Local (dùng khi dev bằng IDE)
│   ├── .env.example        # Template biến môi trường backend
│   └── pom.xml
│
├── MoneyTrack_FE/          # Next.js frontend
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components (shadcn/ui)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities, API client
│   ├── types/              # TypeScript type definitions
│   ├── Dockerfile          # Multi-stage build (deps → builder → runtime)
│   └── package.json
│
├── terraform/              # Infrastructure as Code
│   ├── compute.tf          # ECR, ECS Fargate, ALB, Auto Scaling
│   ├── database.tf         # DynamoDB tables (3 bảng + Global Tables)
│   ├── iam.tf              # IAM roles (ECS, GitHub Actions OIDC)
│   ├── main.tf             # Secrets Manager, ACM, Route 53, Amplify, CloudWatch
│   ├── network.tf          # VPC, Subnets, NAT Gateway, VPC Endpoints
│   ├── security.tf         # Security Groups, WAF
│   ├── storage.tf          # S3 (frontend assets, ALB logs), CloudFront
│   ├── variables.tf        # Khai báo biến
│   ├── outputs.tf          # Outputs sau khi deploy
│   └── terraform.tfvars.example
│
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
│
├── docker-compose.yml      # Full stack local (backend + frontend + DynamoDB Local)
└── README.md
```

---

## 4. Biến môi trường

### Backend (`MoneyTrack_BE/.env`)

```env
# Server
PORT=8080

# AWS / DynamoDB
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB endpoint — để trống khi dùng AWS thật, điền khi dùng DynamoDB Local
# DYNAMODB_ENDPOINT=http://localhost:8000

# Tên bảng DynamoDB
DYNAMODB_TABLE_USERS=moneytrack-users
DYNAMODB_TABLE_CATEGORIES=moneytrack-categories
DYNAMODB_TABLE_TRANSACTIONS=moneytrack-transactions

# JWT
JWT_SECRET=your_strong_random_secret_min_32_chars
JWT_EXPIRATION_MS=86400000
```

> **Lưu ý:** Khi chạy trên AWS (ECS Fargate), **không cần** `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY`.
> ECS task role tự động cấp quyền truy cập DynamoDB. `JWT_SECRET` được inject từ AWS Secrets Manager.

### Frontend (`MoneyTrack_FE/.env.local`)

```env
# URL của backend API — truy cập được từ browser
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> Trên AWS Amplify, biến này được cấu hình trong Amplify Console hoặc qua Terraform (`environment_variables`).

---

## 5. Chạy local

### Yêu cầu

- Java 17+, Maven 3.9+
- Node.js 20+, pnpm (`npm install -g pnpm` hoặc `corepack enable`)
- Docker Desktop
- AWS CLI (nếu muốn kết nối DynamoDB thật)

### 5.1 Backend (IDE / Maven)

```bash
# 1. Vào thư mục backend
cd MoneyTrack_BE

# 2. Tạo file .env từ template
cp .env.example .env
# Chỉnh sửa .env: điền JWT_SECRET, AWS credentials hoặc để DYNAMODB_ENDPOINT=http://localhost:8000

# 3. Khởi động DynamoDB Local (cần Docker)
docker compose up -d

# 4. Chạy backend
./mvnw spring-boot:run

# Backend chạy tại: http://localhost:8080
# Health check:     http://localhost:8080/actuator/health
```

### 5.2 Frontend

```bash
# 1. Vào thư mục frontend
cd MoneyTrack_FE

# 2. Tạo file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 3. Cài dependencies
pnpm install

# 4. Chạy dev server
pnpm dev

# Frontend chạy tại: http://localhost:3000
```

### 5.3 Chạy full stack bằng Docker Compose

```bash
# Từ thư mục gốc MoneyTrack/
# Tạo file .env hoặc export biến
export JWT_SECRET=your-strong-secret-min-32-chars

# Build và chạy toàn bộ stack
docker compose up --build

# Dừng
docker compose down
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| DynamoDB Local | http://localhost:8000 |

### 5.4 Build và chạy Docker image riêng lẻ

**Backend:**

```bash
cd MoneyTrack_BE

# Build image
docker build -t moneytrack-backend:latest .

# Chạy container
docker run -p 8080:8080 \
  -e AWS_REGION=ap-southeast-1 \
  -e AWS_ACCESS_KEY_ID=local \
  -e AWS_SECRET_ACCESS_KEY=local \
  -e DYNAMODB_ENDPOINT=http://host.docker.internal:8000 \
  -e DYNAMODB_TABLE_USERS=moneytrack-users \
  -e DYNAMODB_TABLE_CATEGORIES=moneytrack-categories \
  -e DYNAMODB_TABLE_TRANSACTIONS=moneytrack-transactions \
  -e JWT_SECRET=your-secret \
  moneytrack-backend:latest
```

**Frontend:**

```bash
cd MoneyTrack_FE

# Build image
docker build -t moneytrack-frontend:latest .

# Chạy container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  moneytrack-frontend:latest
```

### 5.5 Chạy tests

**Backend:**

```bash
cd MoneyTrack_BE
./mvnw test
```

**Frontend:**

```bash
cd MoneyTrack_FE
pnpm vitest run
```

---

## 6. Deploy hạ tầng AWS bằng Terraform

### Yêu cầu trước khi chạy

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) đã cấu hình
- Tài khoản AWS với quyền tạo: VPC, ECS, ECR, DynamoDB, S3, CloudFront, Route 53, IAM, Secrets Manager, Amplify
- Domain đã đăng ký (nếu dùng custom domain)
- GitHub Personal Access Token (cho Amplify kết nối repo)

### Cấu hình AWS credentials

```bash
# Cách 1: AWS CLI configure
aws configure
# Nhập: AWS Access Key ID, Secret Access Key, Region (ap-southeast-1), output format (json)

# Cách 2: Export biến môi trường
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-southeast-1

# Kiểm tra
aws sts get-caller-identity
```

### Tạo file terraform.tfvars

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Chỉnh sửa `terraform.tfvars` — các giá trị bắt buộc phải thay:

```hcl
# Thông tin dự án
project_name = "moneytrack"
environment  = "prod"

# Domain của bạn
domain_name        = "your-domain.com"
frontend_subdomain = "www"
api_subdomain      = "api"

# Secret JWT — dùng chuỗi ngẫu nhiên mạnh (min 32 ký tự)
jwt_secret = "REPLACE_WITH_STRONG_RANDOM_SECRET_MIN_32_CHARS"

# GitHub
github_org   = "your-github-username-or-org"
github_repo  = "MoneyTrack"
github_token = "ghp_your_github_personal_access_token"
```

> **Không commit `terraform.tfvars`** — file này đã có trong `.gitignore`.

### Triển khai

```bash
cd terraform

# 1. Khởi tạo Terraform (tải providers)
terraform init

# 2. Format code (tùy chọn)
terraform fmt

# 3. Validate cú pháp
terraform validate

# 4. Xem trước thay đổi
terraform plan

# 5. Triển khai (nhập 'yes' để xác nhận)
terraform apply
```

### Các resource được tạo

| Resource | Mô tả |
|---|---|
| VPC + Subnets | 1 VPC, 2 public subnets (ALB), 2 private subnets (ECS) |
| NAT Gateway | 2 NAT GW (1 per AZ) cho ECS outbound |
| VPC Endpoints | DynamoDB, ECR, CloudWatch Logs, Secrets Manager, SSM |
| ECR | Repository `moneytrack-be` lưu Docker images |
| ECS Fargate | Cluster + Service + Task Definition (Spring Boot) |
| ALB | Application Load Balancer (HTTP → HTTPS redirect) |
| Global Accelerator | Anycast IPs, route traffic đến ALB |
| DynamoDB | 3 bảng: users, categories, transactions (Global Tables) |
| S3 | Bucket frontend assets + bucket ALB access logs |
| CloudFront | CDN phân phối frontend từ S3 |
| AWS Amplify | Build và host Next.js frontend |
| ACM | TLS certificates cho API và frontend |
| Route 53 | DNS records cho api.* và www.* |
| Secrets Manager | Lưu JWT secret |
| IAM Roles | ECS task execution role, ECS task role, GitHub Actions OIDC role |
| CloudWatch | Log groups, alarms (CPU, 5xx errors), dashboard |
| SNS | Topic gửi alert email |
| WAF | Rate limiting (2000 req/5 phút/IP) |

### Outputs sau khi deploy

```bash
terraform output
```

| Output | Mô tả |
|---|---|
| `ecr_repository_url` | URL ECR để push Docker image |
| `ecs_cluster_name` | Tên ECS cluster |
| `ecs_service_name` | Tên ECS service |
| `alb_dns_name` | DNS của ALB |
| `api_url` | URL API công khai (`https://api.your-domain.com`) |
| `frontend_url` | URL frontend (`https://www.your-domain.com`) |
| `cloudfront_distribution_id` | ID CloudFront (dùng để invalidate cache) |
| `frontend_s3_bucket` | Tên S3 bucket frontend |
| `github_actions_role_arn` | ARN IAM role cho GitHub Actions OIDC |
| `amplify_app_id` | ID Amplify app |
| `cloudwatch_dashboard_url` | Link CloudWatch dashboard |

---

## 7. Thao tác thủ công trên AWS Console

Một số bước Terraform không tự động hóa hoàn toàn và cần thực hiện thủ công:

### 7.1 Cấu hình GitHub Secrets / Variables

Vào **GitHub repo → Settings → Secrets and variables → Actions**:

**Secrets** (nhạy cảm):

| Secret | Giá trị | Lấy từ đâu |
|---|---|---|
| `AWS_GITHUB_ACTIONS_ROLE_ARN` | `arn:aws:iam::<account-id>:role/moneytrack-prod-github-actions-role` | `terraform output github_actions_role_arn` |

**Variables** (không nhạy cảm):

| Variable | Giá trị mẫu | Lấy từ đâu |
|---|---|---|
| `AWS_REGION` | `ap-southeast-1` | `terraform.tfvars` |
| `ECR_REPOSITORY_BE` | `<account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/moneytrack-be` | `terraform output ecr_repository_url` |
| `ECS_CLUSTER_NAME` | `moneytrack-prod-cluster` | `terraform output ecs_cluster_name` |
| `ECS_SERVICE_NAME` | `moneytrack-prod-be-service` | `terraform output ecs_service_name` |
| `ECS_TASK_FAMILY` | `moneytrack-prod-be` | Từ `compute.tf` |
| `ECS_CONTAINER_NAME` | `moneytrack-be` | Từ `compute.tf` |
| `AMPLIFY_APP_ID` | `d1abc2def3ghi` | `terraform output amplify_app_id` |
| `AMPLIFY_BRANCH` | `main` | `terraform.tfvars` |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com` | `terraform output api_url` |

### 7.2 Cấu hình DNS (Route 53 / Domain Registrar)

Nếu domain đăng ký ở ngoài AWS (GoDaddy, Namecheap...):

1. Vào **Route 53 Console → Hosted Zones → your-domain.com**
2. Copy 4 Name Server records (NS)
3. Vào domain registrar → cập nhật nameservers thành NS của Route 53
4. Chờ DNS propagate (15 phút – 48 giờ)

Nếu `create_route53_zone = true` trong `terraform.tfvars`, Terraform đã tạo hosted zone. Chỉ cần cập nhật NS ở registrar.

### 7.3 Xác nhận ACM Certificate

Terraform tạo certificate và DNS validation records tự động. Tuy nhiên nếu DNS chưa propagate:

1. Vào **ACM Console → Certificates**
2. Kiểm tra status: phải là `Issued` (không phải `Pending validation`)
3. Nếu vẫn `Pending` sau 30 phút → kiểm tra DNS records đã được tạo đúng chưa

### 7.4 Kiểm tra DynamoDB tables

1. Vào **DynamoDB Console → Tables**
2. Xác nhận 3 bảng đã tạo: `moneytrack-users`, `moneytrack-categories`, `moneytrack-transactions`
3. Kiểm tra GSI (Global Secondary Index) đã active
4. Nếu bật Global Tables: kiểm tra replica ở region `ap-northeast-1`

### 7.5 Kiểm tra ECS sau deploy đầu tiên

1. Vào **ECS Console → Clusters → moneytrack-prod-cluster → Services**
2. Kiểm tra service status: `ACTIVE`, running count = desired count
3. Vào tab **Events** để xem lịch sử deployment
4. Vào tab **Tasks** → click vào task → xem logs trong CloudWatch

### 7.6 Kiểm tra Amplify

1. Vào **Amplify Console → moneytrack-prod-frontend**
2. Kiểm tra build status của branch `main`: phải là `Succeeded`
3. Nếu build fail: xem build logs để debug

### 7.7 Xác nhận JWT Secret trong Secrets Manager

1. Vào **Secrets Manager Console**
2. Tìm secret `moneytrack/prod/jwt-secret`
3. Xác nhận secret đã có giá trị (không phải placeholder)

---

## 8. CI/CD với GitHub Actions

### Workflow nằm ở đâu

```
.github/workflows/deploy.yml
```

### Khi nào workflow chạy

- **Tự động**: Mỗi khi push commit lên branch `main`
- **Thủ công**: Vào tab **Actions → Deploy MoneyTrack → Run workflow**
  - Có thể chọn deploy backend/frontend riêng lẻ
  - Có thể chỉ định image tag tùy chỉnh

### Các bước chính

```
push to main
    │
    ├── Job: backend (chạy song song với frontend)
    │     ├── Checkout source
    │     ├── Setup JDK 17 + Maven cache
    │     ├── mvn test (unit tests + jqwik PBT)
    │     ├── Publish JUnit test report
    │     ├── Configure AWS via OIDC (không cần access key)
    │     ├── Login ECR
    │     ├── docker build + push (tag: <git-sha> + latest)
    │     ├── Download current ECS task definition
    │     ├── Render task def mới (chỉ thay image URI)
    │     ├── Deploy to ECS Fargate (wait stable, auto-rollback nếu fail)
    │     └── Verify ECS service status
    │
    └── Job: frontend (chạy song song với backend)
          ├── Checkout source
          ├── Setup Node 20 + pnpm
          ├── pnpm install --frozen-lockfile
          ├── pnpm vitest run
          ├── pnpm build (smoke check)
          ├── Configure AWS via OIDC
          ├── aws amplify start-job (trigger Amplify build)
          └── Poll Amplify build status (max 10 phút)
```

### Secrets / Variables cần cấu hình

Xem chi tiết tại [mục 7.1](#71-cấu-hình-github-secrets--variables).

### Kiểm tra kết quả deploy

1. **GitHub Actions**: Vào tab **Actions** → xem run mới nhất → kiểm tra từng step
2. **Backend**: Vào **ECS Console** → kiểm tra service running count và task health
3. **Frontend**: Vào **Amplify Console** → kiểm tra build status
4. **Smoke test**:
   ```bash
   curl https://api.your-domain.com/actuator/health
   # Expected: {"status":"UP"}
   ```

---

## 9. Ghi chú về DynamoDB

### Tại sao dùng DynamoDB thay MySQL

MoneyTrack sử dụng **Amazon DynamoDB** (NoSQL) thay vì MySQL/PostgreSQL vì:
- Serverless, không cần quản lý database server
- Auto-scaling theo workload
- Tích hợp native với AWS IAM (không cần username/password)
- Global Tables cho replication đa vùng

### Tên bảng

Tên bảng được cấu hình qua biến môi trường, không hard-code trong source:

| Biến | Giá trị mặc định |
|---|---|
| `DYNAMODB_TABLE_USERS` | `moneytrack-users` |
| `DYNAMODB_TABLE_CATEGORIES` | `moneytrack-categories` |
| `DYNAMODB_TABLE_TRANSACTIONS` | `moneytrack-transactions` |

### Khuyến nghị IAM Role trên AWS

Khi chạy trên ECS Fargate, **không dùng** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. Thay vào đó:

- ECS task role (`moneytrack-prod-ecs-task-role`) đã được Terraform cấp quyền DynamoDB
- AWS SDK tự động lấy credentials từ ECS metadata endpoint
- Không có credentials nào được lưu trong image hoặc environment variables

### DynamoDB Local cho development

```bash
# Chạy DynamoDB Local
cd MoneyTrack_BE
docker compose up -d

# Kiểm tra
curl http://localhost:8000

# Xem danh sách bảng (sau khi backend khởi động lần đầu)
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region ap-southeast-1 \
  --no-sign-request
```

### Migrate dữ liệu

DynamoDB không có schema migration như SQL. Nếu cần migrate dữ liệu từ nguồn khác:

1. **Export từ MySQL**: Dùng `mysqldump` hoặc query ra CSV/JSON
2. **Transform**: Viết script Python/Node.js để chuyển đổi format
3. **Import vào DynamoDB**: Dùng `aws dynamodb batch-write-item` hoặc AWS Data Pipeline

Không có migration script sẵn trong repo — cần viết riêng theo nhu cầu.

---

## 10. Troubleshooting

### Backend không kết nối được DynamoDB

**Triệu chứng:** `Unable to execute HTTP request: Connection refused` hoặc `UnknownHostException`

```bash
# Kiểm tra DynamoDB Local có chạy không
docker ps | grep dynamodb

# Kiểm tra endpoint trong .env
cat MoneyTrack_BE/.env | grep DYNAMODB_ENDPOINT

# Test kết nối
curl http://localhost:8000
```

**Nguyên nhân thường gặp:**
- DynamoDB Local chưa chạy → `docker compose up -d`
- `DYNAMODB_ENDPOINT` sai URL → kiểm tra port (mặc định 8000)
- Khi chạy trong Docker container: dùng `http://host.docker.internal:8000` thay vì `http://localhost:8000`

---

### Thiếu AWS credentials

**Triệu chứng:** `Unable to load AWS credentials from any provider in the chain`

```bash
# Kiểm tra credentials hiện tại
aws sts get-caller-identity

# Nếu dùng .env: kiểm tra file đã có giá trị chưa
cat MoneyTrack_BE/.env | grep AWS_ACCESS_KEY_ID
```

**Giải pháp:**
- Local: điền `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` vào `.env`
- Trên AWS: đảm bảo ECS task role đã được gán đúng policy DynamoDB

---

### GitHub Actions fail khi login ECR

**Triệu chứng:** `Error: Could not assume role with OIDC`

**Kiểm tra:**
1. Secret `AWS_GITHUB_ACTIONS_ROLE_ARN` đã được set chưa
2. IAM role trust policy có đúng `github_org` và `github_repo` không
3. OIDC provider đã tạo trong AWS account chưa (`create_github_oidc_provider = true`)

```bash
# Kiểm tra OIDC provider
aws iam list-open-id-connect-providers

# Kiểm tra role trust policy
aws iam get-role --role-name moneytrack-prod-github-actions-role \
  --query 'Role.AssumeRolePolicyDocument'
```

---

### Docker container không start

**Triệu chứng:** Container exit ngay sau khi start

```bash
# Xem logs container
docker logs <container-id>

# Chạy interactive để debug
docker run -it --entrypoint sh moneytrack-backend:latest

# Kiểm tra health check
docker inspect <container-id> | grep -A 10 Health
```

**Nguyên nhân thường gặp:**
- Thiếu biến môi trường bắt buộc (JWT_SECRET, AWS_REGION)
- Port đã bị chiếm → kiểm tra `lsof -i :8080`
- JAR không build được → chạy `mvn clean package` trước

---

### Frontend gọi sai API URL

**Triệu chứng:** Network error, CORS error, hoặc 404 khi gọi API

```bash
# Kiểm tra biến môi trường frontend
cat MoneyTrack_FE/.env.local

# Kiểm tra trong browser: F12 → Network → xem request URL
```

**Giải pháp:**
- Local: đảm bảo `NEXT_PUBLIC_API_URL=http://localhost:8080` trong `.env.local`
- Production: kiểm tra biến `NEXT_PUBLIC_API_URL` trong Amplify Console → Environment variables
- CORS: kiểm tra `SecurityConfig.java` — backend phải allow origin của frontend

---

### Terraform thiếu permission

**Triệu chứng:** `AccessDeniedException` hoặc `UnauthorizedOperation` khi chạy `terraform apply`

```bash
# Kiểm tra identity đang dùng
aws sts get-caller-identity

# Xem lỗi chi tiết
terraform apply 2>&1 | grep -A 5 "Error:"
```

**Giải pháp:**
- IAM user/role cần có quyền: `AdministratorAccess` hoặc policy tùy chỉnh bao gồm tất cả services trong `terraform/`
- Kiểm tra region đúng chưa: `AWS_DEFAULT_REGION=ap-southeast-1`

---

### Port bị conflict

**Triệu chứng:** `Port 8080 is already in use` hoặc `bind: address already in use`

```bash
# Tìm process đang dùng port
# Windows
netstat -ano | findstr :8080

# macOS / Linux
lsof -i :8080
kill -9 <PID>

# Hoặc đổi port trong .env
PORT=8081
```

---

### ECS task không start sau deploy

**Triệu chứng:** ECS service stuck ở `PENDING`, tasks liên tục restart

```bash
# Xem ECS service events
aws ecs describe-services \
  --cluster moneytrack-prod-cluster \
  --services moneytrack-prod-be-service \
  --query 'services[0].events[:5]'

# Xem logs của task failed
aws logs get-log-events \
  --log-group-name /ecs/moneytrack-prod \
  --log-stream-name ecs/moneytrack-be/<task-id>
```

**Nguyên nhân thường gặp:**
- Image không tồn tại trong ECR → kiểm tra tag đúng chưa
- Health check fail → kiểm tra `/actuator/health` endpoint
- Thiếu secret trong Secrets Manager → kiểm tra `moneytrack/prod/jwt-secret`
- ECS task role thiếu quyền DynamoDB → kiểm tra IAM policy

---

*Cập nhật lần cuối: tháng 5/2026*
