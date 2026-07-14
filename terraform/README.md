# MoneyTrack — Terraform Infrastructure

Terraform code để triển khai toàn bộ hạ tầng AWS cho dự án MoneyTrack theo kiến trúc multi-region.

---

## Kiến trúc tổng quan

```
User
├── www.moneytrack.com  →  Route 53  →  CloudFront  →  S3 (static)
└── api.moneytrack.com  →  Route 53  →  Global Accelerator
                                              └──  ALB (public subnet)
                                                    └──  AWS WAF
                                                          └──  ECS Fargate (private subnet)
                                                                └──  DynamoDB Global Tables
                                                                └──  Secrets Manager (JWT)
```

---

## Cấu trúc file

| File | Nội dung |
|---|---|
| `provider.tf` | AWS provider config (primary, secondary, us-east-1) |
| `variables.tf` | Tất cả biến đầu vào |
| `network.tf` | VPC, Subnets, IGW, NAT GW, Route Tables, VPC Endpoints |
| `security.tf` | Security Groups, AWS WAF Web ACL |
| `iam.tf` | IAM Roles/Policies (ECS execution, task, GitHub Actions OIDC) |
| `compute.tf` | ECR, ECS Cluster/Service/Task, ALB, Auto Scaling |
| `database.tf` | DynamoDB Global Tables (users, categories, transactions) |
| `storage.tf` | S3 (frontend, ALB logs), CloudFront distribution |
| `main.tf` | Secrets Manager, ACM, Route 53, Global Accelerator, CloudWatch |
| `outputs.tf` | Tất cả output quan trọng |
| `terraform.tfvars.example` | Template biến — copy thành `terraform.tfvars` |

---

## AWS Resources được tạo

### Networking
- VPC (`10.0.0.0/16`)
- 2 Public Subnets (ALB, NAT GW)
- 2 Private Subnets (ECS Fargate)
- Internet Gateway
- 2 NAT Gateways (1 per AZ, HA)
- Route Tables (public + private per AZ)
- VPC Endpoints: DynamoDB (Gateway), S3 (Gateway), ECR API/DKR (Interface), CloudWatch Logs (Interface), Secrets Manager (Interface), SSM (Interface)

### Security
- Security Group: ALB (80/443 from internet)
- Security Group: ECS (8080 from ALB only)
- Security Group: VPC Endpoints (443 from VPC CIDR)
- AWS WAF Web ACL (rate limiting + AWS managed rules)

### Compute
- ECR Repository (`moneytrack-be`)
- ECS Cluster (Container Insights enabled)
- ECS Task Definition (Fargate, 0.5 vCPU / 1 GB)
- ECS Service (2 tasks, private subnets, auto-scaling)
- Application Load Balancer (internet-facing, multi-AZ)
- ALB Listeners (HTTP→HTTPS redirect, HTTPS→ECS)
- ECS Auto Scaling (CPU 70%, Memory 80%, min 1 / max 4)

### Database
- DynamoDB Table: `moneytrack-users` (PAY_PER_REQUEST, GSI: email-index)
- DynamoDB Table: `moneytrack-categories` (PAY_PER_REQUEST, GSI: type-index)
- DynamoDB Table: `moneytrack-transactions` (PAY_PER_REQUEST, GSI: userId-date-index)
- DynamoDB Global Tables replication to secondary region
- Point-in-time recovery enabled

### Storage & CDN
- S3 Bucket: Frontend static assets (private, OAC)
- S3 Bucket: ALB access logs
- CloudFront Distribution (HTTPS, SPA fallback, OAC)

### DNS & Networking
- Route 53 Records (A alias: api → Global Accelerator, www → CloudFront)
- ACM Certificate: `api.moneytrack.com` (primary region)
- ACM Certificate: `www.moneytrack.com` (us-east-1 for CloudFront)
- AWS Global Accelerator (anycast IPs, TCP 80/443)

### Security & Secrets
- AWS Secrets Manager: JWT secret
- IAM Role: ECS Task Execution (ECR pull, CloudWatch logs, Secrets Manager)
- IAM Role: ECS Task (DynamoDB, Secrets Manager, SSM, CloudWatch)
- IAM Role: GitHub Actions (OIDC, ECR push, ECS deploy)

### Monitoring
- CloudWatch Log Group: `/ecs/moneytrack-prod`
- CloudWatch Alarms: ECS CPU > 80%, ALB 5xx > 10
- CloudWatch Dashboard
- SNS Topic: email alerts

---

## Cách sử dụng

### 1. Cài đặt prerequisites

```bash
# Terraform >= 1.5
terraform --version

# AWS CLI v2
aws --version
aws configure   # hoặc dùng IAM role
```

### 2. Chuẩn bị biến

```bash
cp terraform.tfvars.example terraform.tfvars
# Chỉnh sửa terraform.tfvars với giá trị thực
```

### 3. Khởi tạo

```bash
terraform init
```

### 4. Validate & Format

```bash
terraform fmt -recursive
terraform validate
```

### 5. Plan

```bash
terraform plan -out=tfplan
```

### 6. Apply

```bash
terraform apply tfplan
```

---

## Biến bắt buộc

| Biến | Mô tả |
|---|---|
| `domain_name` | Root domain (e.g. `moneytrack.com`) |
| `github_org` | GitHub org/username |
| `github_repo` | GitHub repo name |

> `jwt_secret` không còn là biến đầu vào — Terraform tự sinh ngẫu nhiên (`random_password`) và lưu vào Secrets Manager.

---

## Outputs quan trọng sau deploy

```bash
terraform output ecr_repository_url        # Push Docker image vào đây
terraform output api_url                   # URL API backend
terraform output global_accelerator_static_ips  # Whitelist IPs nếu cần
terraform output github_actions_role_arn   # Dùng trong GitHub Actions workflow
terraform output cloudwatch_dashboard_url  # Link dashboard monitoring
```

---

## Những phần cần thao tác thủ công trên AWS Console

### 1. Đăng ký domain (nếu chưa có)
- Vào **Route 53 → Registered Domains** → Register domain `moneytrack.com`
- Hoặc transfer domain từ registrar khác

### 2. Cập nhật NS records tại registrar
- Sau khi tạo Hosted Zone, lấy 4 NS records từ Route 53
- Cập nhật tại domain registrar (GoDaddy, Namecheap, v.v.)
- Chờ DNS propagation (24-48h)

### 3. Amazon Managed Prometheus & Grafana (observability)
- Terraform AWS provider chưa hỗ trợ đầy đủ AMP/AMG
- Tạo thủ công:
  - **AMP**: Console → Amazon Managed Service for Prometheus → Create workspace
  - **AMG**: Console → Amazon Managed Grafana → Create workspace → Connect AMP
  - Cấu hình Prometheus remote_write từ ECS tasks

### 4. GitHub Actions Secrets
Sau khi `terraform apply`, thêm vào GitHub repo secrets:
```
AWS_ROLE_ARN = <github_actions_role_arn output>
AWS_REGION   = ap-southeast-1
ECR_REPO_URL = <ecr_repository_url output>
ECS_CLUSTER  = <ecs_cluster_name output>
ECS_SERVICE  = <ecs_service_name output>
```

### 5. DynamoDB Global Tables — Secondary region setup
- Nếu `dynamodb_enable_global_tables = true`, đảm bảo secondary region đã được enable trong AWS account
- Kiểm tra replication status trong Console sau apply

### 6. WAF — Tuning rules
- Sau khi deploy, monitor WAF logs trong CloudWatch
- Điều chỉnh rate limit và managed rules nếu có false positives

---

## Giả định khi thiết kế

1. **Single ECR registry** — dùng chung cho cả 2 regions (ECR là global per account)
2. **DynamoDB Global Tables** — replication sang secondary region cho DR; có thể tắt bằng `dynamodb_enable_global_tables = false`
3. **NAT Gateway per AZ** — 2 NAT GW cho HA; có thể giảm xuống 1 để tiết kiệm chi phí dev/staging
4. **ECS Exec enabled** — cho phép debug container qua SSM Session Manager mà không cần SSH
5. **`prevent_destroy = true`** trên DynamoDB tables — bảo vệ data production; xóa lifecycle block nếu cần destroy
