# Design Document: Terraform Multi-Region Refactor

## 1. Overview

### 1.1 Architecture Summary

The refactor transforms the existing flat single-directory Terraform layout into a three-layer hierarchy:

```
Bootstrap Layer  ──►  provisions S3 state bucket + DynamoDB lock table (applied once)
     │
     ▼
Modules Layer    ──►  7 reusable modules derived strictly from existing .tf files
     │
     ▼
Environments Layer ──► 4 env-region root modules that compose modules with isolated state
```

**Bootstrap Layer** (`terraform/bootstrap/`) provisions only the remote-state backend. It uses a local backend and is applied once per AWS account. It has zero dependency on application infrastructure.

**Modules Layer** (`terraform/modules/`) contains seven modules whose boundaries map 1:1 to the existing source files. No new AWS services or resources are introduced.

**Environments Layer** (`terraform/environments/<env>/<region>/`) contains four root modules — one per environment-region combination — each with its own isolated S3 state key.

### 1.2 Complete Directory Tree

Every file that will be created in the refactored layout:

```
terraform/
├── bootstrap/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars
│
├── modules/
│   ├── network/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── security/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── iam/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── observability/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── global-services/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/
    ├── dev/
    │   ├── ap-southeast-1/
    │   │   ├── backend.tf
    │   │   ├── provider.tf
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   ├── outputs.tf
    │   │   └── terraform.tfvars
    │   └── ap-northeast-1/
    │       ├── backend.tf
    │       ├── provider.tf
    │       ├── main.tf
    │       ├── variables.tf
    │       ├── outputs.tf
    │       └── terraform.tfvars
    └── prod/
        ├── ap-southeast-1/
        │   ├── backend.tf
        │   ├── provider.tf
        │   ├── main.tf
        │   ├── variables.tf
        │   ├── outputs.tf
        │   └── terraform.tfvars
        └── ap-northeast-1/
            ├── backend.tf
            ├── provider.tf
            ├── main.tf
            ├── variables.tf
            ├── outputs.tf
            └── terraform.tfvars
```

---

## 2. Bootstrap Layer (`terraform/bootstrap/`)

The bootstrap layer is applied exactly once per AWS account. It provisions the S3 bucket and DynamoDB table that all environment-region directories use as their remote backend. It uses `backend "local" {}` so its own state is stored on disk — never inside the bucket it creates.

### 2.1 `bootstrap/main.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "local" {}
}

provider "aws" {
  region = var.aws_region
}

# S3 bucket for Terraform state
resource "aws_s3_bucket" "state" {
  bucket = var.state_bucket_name

  tags = {
    Name      = var.state_bucket_name
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "lock" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name      = var.lock_table_name
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}
```

### 2.2 `bootstrap/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used in resource tags"
  type        = string
  default     = "moneytrack"
}

variable "aws_region" {
  description = "AWS region where the state bucket and lock table are created"
  type        = string
  default     = "ap-southeast-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket used to store Terraform state"
  type        = string
  default     = "moneytrack-terraform-state"
}

variable "lock_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking"
  type        = string
  default     = "moneytrack-terraform-locks"
}
```

### 2.3 `bootstrap/outputs.tf`

```hcl
output "state_bucket_name" {
  description = "Name of the S3 bucket created for Terraform state storage"
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_arn" {
  description = "ARN of the S3 bucket created for Terraform state storage"
  value       = aws_s3_bucket.state.arn
}

output "lock_table_name" {
  description = "Name of the DynamoDB table created for Terraform state locking"
  value       = aws_dynamodb_table.lock.name
}
```

### 2.4 `bootstrap/terraform.tfvars`

```hcl
project_name      = "moneytrack"
aws_region        = "ap-southeast-1"
state_bucket_name = "moneytrack-terraform-state"
lock_table_name   = "moneytrack-terraform-locks"
```

---

## 3. Module Design

### Design Decision: Circular Dependency Resolution (Network ↔ Security)

In the flat structure, `network.tf` references `aws_security_group.vpc_endpoint.id` (defined in `security.tf`), and `security.tf` references `aws_vpc.main.id` (defined in `network.tf`). This creates a circular dependency if naively split into two modules.

**Resolution:** The `vpc_endpoint` security group is moved _into_ the `network` module. The network module creates all three security groups and outputs `vpc_endpoint_sg_id`, `alb_sg_id`, and `ecs_sg_id`. The security module is then responsible only for the WAF Web ACL and WAF association — it receives `alb_sg_id`, `ecs_sg_id`, and `vpc_endpoint_sg_id` as outputs from the network module, and receives `alb_arn` from the compute module.

This eliminates the cycle: network has no dependency on security; security depends on network (for `vpc_id`) and compute (for `alb_arn`).

---

### 3a. Module: `terraform/modules/network/`

**Derived from:** `network.tf`

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `data "aws_availability_zones"` | `available` |
| `aws_vpc` | `main` |
| `aws_subnet` (count=2) | `public` |
| `aws_subnet` (count=2) | `private` |
| `aws_internet_gateway` | `main` |
| `aws_eip` (count=2) | `nat` |
| `aws_nat_gateway` (count=2) | `main` |
| `aws_route_table` | `public` |
| `aws_route_table` (count=2) | `private` |
| `aws_route_table_association` (count=2) | `public` |
| `aws_route_table_association` (count=2) | `private` |
| `aws_vpc_endpoint` | `dynamodb` (Gateway) |
| `aws_vpc_endpoint` | `s3` (Gateway) |
| `aws_vpc_endpoint` | `ecr_api` (Interface) |
| `aws_vpc_endpoint` | `ecr_dkr` (Interface) |
| `aws_vpc_endpoint` | `logs` (Interface) |
| `aws_vpc_endpoint` | `secretsmanager` (Interface) |
| `aws_vpc_endpoint` | `ssm` (Interface) |
| `aws_security_group` | `alb` |
| `aws_security_group` | `ecs` |
| `aws_security_group` | `vpc_endpoint` |

Note: The three security groups (`alb`, `ecs`, `vpc_endpoint`) are placed in this module to break the circular dependency described above. The VPC must exist before security groups referencing it can be created, and the vpc_endpoint SG must exist before Interface VPC Endpoints referencing it can be created — both concerns belong in the same module.

#### `modules/network/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "primary_region" {
  description = "AWS region — used to construct VPC endpoint service_name strings"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
}

variable "container_port" {
  description = "Container port — used in ECS security group ingress rule"
  type        = number
}
```

#### `modules/network/outputs.tf`

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_public_ips" {
  description = "Elastic IPs of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "private_route_table_ids" {
  description = "IDs of the private route tables (one per AZ)"
  value       = aws_route_table.private[*].id
}

output "vpc_endpoint_sg_id" {
  description = "ID of the VPC endpoint security group"
  value       = aws_security_group.vpc_endpoint.id
}

output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs.id
}
```

---

### 3b. Module: `terraform/modules/security/`

**Derived from:** `security.tf` (WAF resources only — security groups moved to network module)

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `aws_wafv2_web_acl` | `main` |
| `aws_wafv2_web_acl_association` | `alb` |

Note: The three `aws_security_group` resources (`alb`, `ecs`, `vpc_endpoint`) from `security.tf` are located in the network module to resolve the circular dependency. The security module is scoped to WAF only. WAF rules are preserved exactly: RateLimitRule (priority 1), AWSManagedRulesCommonRuleSet (priority 2), AWSManagedRulesKnownBadInputsRuleSet (priority 3).

#### `modules/security/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the ALB — used for WAF web ACL association"
  type        = string
}

variable "waf_rate_limit" {
  description = "Maximum requests per 5-minute window per IP (WAF rate-based rule)"
  type        = number
}
```

#### `modules/security/outputs.tf`

```hcl
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}
```

---

### 3c. Module: `terraform/modules/compute/`

**Derived from:** `compute.tf`

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `aws_ecr_repository` | `backend` |
| `aws_ecr_lifecycle_policy` | `backend` |
| `aws_ecs_cluster` | `main` |
| `aws_ecs_cluster_capacity_providers` | `main` |
| `aws_cloudwatch_log_group` | `ecs` |
| `aws_ecs_task_definition` | `backend` |
| `aws_lb` | `main` |
| `aws_lb_target_group` | `backend` |
| `aws_lb_listener` | `http` |
| `aws_lb_listener` | `https` |
| `aws_ecs_service` | `backend` |
| `aws_appautoscaling_target` | `ecs` |
| `aws_appautoscaling_policy` | `ecs_cpu` |
| `aws_appautoscaling_policy` | `ecs_memory` |

ECR lifecycle policy preserves exactly: untagged images expire after 1 day (priority 1), tagged images with prefixes `v`/`latest` keep last 10 (priority 2).

ALB preserves `enable_deletion_protection = var.environment == "prod" ? true : false`.

ECS service preserves `enable_execute_command = true`, `depends_on = [aws_lb_listener.https, aws_iam_role_policy_attachment.ecs_execution_managed]`, and `lifecycle { ignore_changes = [desired_count] }`.

Auto-scaling policies preserve CPU target 70%, memory target 80%, scale-in cooldown 300s, scale-out cooldown 60s.

#### `modules/compute/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region — used in ECS task definition log configuration"
  type        = string
}

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR (MUTABLE | IMMUTABLE)"
  type        = string
}

variable "ecs_cpu" {
  description = "CPU units for the ECS Fargate task"
  type        = number
}

variable "ecs_memory" {
  description = "Memory (MiB) for the ECS Fargate task"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of ECS task instances"
  type        = number
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy (e.g. latest, v1.2.3)"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
}

variable "dynamodb_table_users" {
  description = "Name of the DynamoDB users table — injected as env var into container"
  type        = string
}

variable "dynamodb_table_categories" {
  description = "Name of the DynamoDB categories table — injected as env var into container"
  type        = string
}

variable "dynamodb_table_transactions" {
  description = "Name of the DynamoDB transactions table — injected as env var into container"
  type        = string
}

# Cross-module inputs from network module
variable "vpc_id" {
  description = "VPC ID — used by ALB target group"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs — used by ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs — used by ECS service"
  type        = list(string)
}

# Cross-module inputs from network module (security groups)
variable "alb_sg_id" {
  description = "ALB security group ID"
  type        = string
}

variable "ecs_sg_id" {
  description = "ECS tasks security group ID"
  type        = string
}

# Cross-module inputs from iam module
variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task IAM role"
  type        = string
}

# Cross-module inputs from global-services module
variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener"
  type        = string
}

variable "jwt_secret_arn" {
  description = "Secrets Manager ARN of the JWT secret — injected into container"
  type        = string
}

variable "alb_logs_bucket_id" {
  description = "S3 bucket ID for ALB access logs"
  type        = string
}
```

#### `modules/compute/outputs.tf`

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix of the ALB — used in CloudWatch alarm dimensions"
  value       = aws_lb.main.arn_suffix
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role (passthrough)"
  value       = var.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role (passthrough)"
  value       = var.ecs_task_role_arn
}
```

---

### 3d. Module: `terraform/modules/database/`

**Derived from:** `database.tf`

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `aws_dynamodb_table` | `users` |
| `aws_dynamodb_table` | `categories` |
| `aws_dynamodb_table` | `transactions` |

All three tables preserve: `billing_mode = "PAY_PER_REQUEST"`, GSI definitions, `point_in_time_recovery`, `server_side_encryption`, `stream_enabled` / `stream_view_type` conditional on `dynamodb_enable_global_tables`, `dynamic "replica"` block, and `lifecycle { prevent_destroy = true }`.

**Note on DynamoDB Global Tables replication:** The `dynamic "replica"` block in DynamoDB uses only `region_name` — it does not require a provider alias. DynamoDB handles cross-region replication internally via the replica block. The database module does NOT need to declare or accept a secondary provider alias. The `secondary_region` variable is passed in and used directly as the replica region name.

#### `modules/database/variables.tf`

```hcl
variable "project_name" {
  description = "Project name — used in resource tags"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region for DynamoDB Global Tables replication"
  type        = string
}

variable "dynamodb_enable_global_tables" {
  description = "Enable DynamoDB Global Tables replication to secondary region"
  type        = bool
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
}

variable "dynamodb_table_users" {
  description = "Name of the DynamoDB users table"
  type        = string
}

variable "dynamodb_table_categories" {
  description = "Name of the DynamoDB categories table"
  type        = string
}

variable "dynamodb_table_transactions" {
  description = "Name of the DynamoDB transactions table"
  type        = string
}
```

#### `modules/database/outputs.tf`

```hcl
output "users_table_name" {
  description = "DynamoDB users table name"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "DynamoDB users table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "categories_table_name" {
  description = "DynamoDB categories table name"
  value       = aws_dynamodb_table.categories.name
}

output "categories_table_arn" {
  description = "DynamoDB categories table ARN"
  value       = aws_dynamodb_table.categories.arn
}

output "transactions_table_name" {
  description = "DynamoDB transactions table name"
  value       = aws_dynamodb_table.transactions.name
}

output "transactions_table_arn" {
  description = "DynamoDB transactions table ARN"
  value       = aws_dynamodb_table.transactions.arn
}
```

---

### 3e. Module: `terraform/modules/iam/`

**Derived from:** `iam.tf`

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `data "aws_iam_policy_document"` | `ecs_assume_role` |
| `aws_iam_role` | `ecs_task_execution` |
| `aws_iam_role_policy_attachment` | `ecs_execution_managed` |
| `aws_iam_role_policy` | `ecs_execution_secrets` |
| `aws_iam_role` | `ecs_task` |
| `aws_iam_role_policy` | `ecs_task_dynamodb` |
| `aws_iam_role_policy` | `ecs_task_secrets` |
| `aws_iam_role_policy` | `ecs_task_ssm` |
| `aws_iam_role_policy` | `ecs_task_cloudwatch` |
| `data "aws_iam_openid_connect_provider"` | `github` (count conditional) |
| `resource "aws_iam_openid_connect_provider"` | `github` (count conditional) |
| `locals` | `github_oidc_provider_arn` |
| `aws_iam_role` | `github_actions` |
| `aws_iam_role_policy` | `github_actions_ecr` |

The `count`-based conditional on OIDC provider (`create_github_oidc_provider ? 1 : 0` for resource, `? 0 : 1` for data source) is preserved exactly.

The `ecs_task_ssm` policy preserves the SSM path pattern `arn:aws:ssm:${var.primary_region}:*:parameter/${var.project_name}/${var.environment}/*`.

#### `modules/iam/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region — used in SSM policy resource ARN"
  type        = string
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "create_github_oidc_provider" {
  description = "Set to true to create the GitHub OIDC provider; false if it already exists"
  type        = bool
}

variable "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager — granted to execution and task roles"
  type        = string
}

variable "dynamodb_table_arns" {
  description = "List of DynamoDB table ARNs — granted to ECS task role for read/write"
  type        = list(string)
}

variable "ecr_repository_arn" {
  description = "ECR repository ARN — granted to GitHub Actions role for image push"
  type        = string
}
```

#### `modules/iam/outputs.tf`

```hcl
output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role"
  value       = aws_iam_role.github_actions.arn
}
```

**Note on `ecs_task_execution_role_arn` passthrough in compute module:** The compute module accepts `ecs_task_execution_role_arn` and `ecs_task_role_arn` as inputs from the IAM module and re-exports them as outputs. This allows the environment-level `outputs.tf` to reference `module.compute.ecs_task_execution_role_arn` consistently — matching the flat structure output pattern — without requiring a direct reference to `module.iam`.

---

### 3f. Module: `terraform/modules/observability/`

**Derived from:** CloudWatch alarm, SNS topic/subscription, and dashboard blocks in `main.tf`

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `aws_cloudwatch_metric_alarm` | `ecs_cpu_high` |
| `aws_cloudwatch_metric_alarm` | `alb_5xx` |
| `aws_sns_topic` | `alerts` |
| `aws_sns_topic_subscription` | `alerts_email` (count conditional) |
| `aws_cloudwatch_dashboard` | `main` |

Alarm thresholds preserved exactly:
- `ecs_cpu_high`: threshold = 80, evaluation_periods = 2, period = 60, statistic = "Average"
- `alb_5xx`: threshold = 10, evaluation_periods = 1, period = 300, statistic = "Sum"

SNS email subscription: `count = var.alert_email != "" ? 1 : 0`

#### `modules/observability/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region — used in CloudWatch dashboard widget region field"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name — used in CloudWatch alarm dimensions"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name — used in CloudWatch alarm dimensions"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix — used in ALB 5xx alarm dimensions"
  type        = string
}

variable "alert_email" {
  description = "Email address for SNS alarm notifications. Empty string disables subscription."
  type        = string
}

variable "sns_topic_name" {
  description = "Name for the SNS alerts topic"
  type        = string
  default     = ""
}
```

Note: `sns_topic_name` has a default of `""`. When empty, the module constructs the name as `${var.project_name}-${var.environment}-alerts` matching the flat structure pattern.

#### `modules/observability/outputs.tf`

```hcl
output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}
```

---

### 3g. Module: `terraform/modules/global-services/`

**Derived from:** ACM, Route 53, Global Accelerator, Secrets Manager, Amplify blocks in `main.tf` + S3 ALB logs in `storage.tf`

**Resources contained:**

| Resource | Logical Name |
|---|---|
| `aws_secretsmanager_secret` | `jwt_secret` |
| `aws_secretsmanager_secret_version` | `jwt_secret` |
| `aws_acm_certificate` | `api` |
| `data "aws_route53_zone"` | `main` (count conditional) |
| `aws_route53_zone` | `main` (count conditional) |
| `locals` | `route53_zone_id` |
| `aws_route53_record` | `api_cert_validation` (for_each) |
| `aws_acm_certificate_validation` | `api` |
| `aws_route53_record` | `api` |
| `aws_globalaccelerator_accelerator` | `main` |
| `aws_globalaccelerator_listener` | `https` |
| `aws_globalaccelerator_endpoint_group` | `primary` |
| `aws_s3_bucket` | `alb_logs` |
| `aws_s3_bucket_server_side_encryption_configuration` | `alb_logs` |
| `aws_s3_bucket_public_access_block` | `alb_logs` |
| `data "aws_elb_service_account"` | `main` |
| `aws_s3_bucket_policy` | `alb_logs` |
| `aws_amplify_app` | `frontend` |
| `aws_amplify_branch` | `main` |
| `aws_amplify_domain_association` | `frontend` |

Key behavior preserved:
- `recovery_window_in_days = var.environment == "prod" ? 30 : 0` on Secrets Manager secret
- `force_destroy = var.alb_logs_bucket_force_destroy` on S3 bucket (env-driven)
- `lifecycle { create_before_destroy = true }` on ACM certificate
- `create_route53_zone` count conditional on zone resource vs. data source
- Global Accelerator flow logs point to `alb_logs` bucket with prefix `"global-accelerator"`
- Global Accelerator fixed hosted zone ID `"Z2BJ6XQ5FK7U4H"` in Route 53 alias record

**Note on `us_east_1` provider alias:** The flat structure declared this alias originally for CloudFront (since removed). The ACM certificate for ALB is created in the primary region — no `us_east_1` alias is needed inside this module. The alias is declared in each environment-region `provider.tf` for forward compatibility but is not passed to or used by the global-services module.

#### `modules/global-services/variables.tf`

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region — used in resource naming and ECS env var"
  type        = string
}

variable "domain_name" {
  description = "Root domain name (e.g. moneytrack.com)"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for the backend API (e.g. api)"
  type        = string
}

variable "frontend_subdomain" {
  description = "Subdomain for the frontend (e.g. www)"
  type        = string
}

variable "create_route53_zone" {
  description = "true = create a new Route 53 zone; false = look up existing zone"
  type        = bool
}

variable "alb_arn" {
  description = "ALB ARN — used as endpoint in Global Accelerator endpoint group"
  type        = string
}

variable "alb_logs_bucket_force_destroy" {
  description = "Allow non-empty S3 bucket to be destroyed (true for non-prod)"
  type        = bool
}

variable "jwt_secret" {
  description = "JWT signing secret value — stored in Secrets Manager"
  type        = string
  sensitive   = true
}

variable "github_org" {
  description = "GitHub organization or username — used in Amplify repository URL"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name — used in Amplify repository URL"
  type        = string
}

variable "github_token" {
  description = "GitHub OAuth token for Amplify"
  type        = string
  sensitive   = true
}

variable "amplify_branch" {
  description = "Git branch to deploy via Amplify"
  type        = string
}

variable "alert_email" {
  description = "Email address — used only to construct API URL output"
  type        = string
}
```

#### `modules/global-services/outputs.tf`

```hcl
output "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "certificate_arn" {
  description = "ARN of the validated ACM certificate for the API subdomain"
  value       = aws_acm_certificate_validation.api.certificate_arn
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = local.route53_zone_id
}

output "alb_logs_bucket_id" {
  description = "S3 bucket ID for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "S3 bucket ARN for ALB access logs"
  value       = aws_s3_bucket.alb_logs.arn
}

output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.dns_name
}

output "global_accelerator_static_ips" {
  description = "Static anycast IPs of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.ip_sets[*].ip_addresses
}

output "api_url" {
  description = "Public API URL"
  value       = "https://${var.api_subdomain}.${var.domain_name}"
}

output "frontend_url" {
  description = "Public frontend URL"
  value       = "https://${var.frontend_subdomain}.${var.domain_name}"
}

output "amplify_app_id" {
  description = "AWS Amplify app ID"
  value       = aws_amplify_app.frontend.id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = aws_amplify_app.frontend.default_domain
}
```

---

## 4. Environment-Region Directory Design

### 4.1 `backend.tf`

The `backend.tf` file specifies the S3 backend with `encrypt = true`. The S3 bucket name and DynamoDB table name are NOT hard-coded — they are supplied at `terraform init` time via `-backend-config` flags or a `backend.hcl` partial configuration file. This allows bootstrap outputs to be injected without modifying source files.

**State key values for each directory:**

| Directory | State key |
|---|---|
| `environments/dev/ap-southeast-1/` | `dev/ap-southeast-1/terraform.tfstate` |
| `environments/dev/ap-northeast-1/` | `dev/ap-northeast-1/terraform.tfstate` |
| `environments/prod/ap-southeast-1/` | `prod/ap-southeast-1/terraform.tfstate` |
| `environments/prod/ap-northeast-1/` | `prod/ap-northeast-1/terraform.tfstate` |

**Example `backend.tf` for `dev/ap-southeast-1/`:**

```hcl
terraform {
  backend "s3" {
    key            = "dev/ap-southeast-1/terraform.tfstate"
    encrypt        = true
    # bucket and dynamodb_table are supplied via backend.hcl or -backend-config:
    #   terraform init -backend-config="bucket=moneytrack-terraform-state" \
    #                  -backend-config="dynamodb_table=moneytrack-terraform-locks" \
    #                  -backend-config="region=ap-southeast-1"
  }
}
```

**Example `backend.hcl` (created once per account, not committed with secrets):**

```hcl
bucket         = "moneytrack-terraform-state"
dynamodb_table = "moneytrack-terraform-locks"
region         = "ap-southeast-1"
```

Then initialize with: `terraform init -backend-config=../../../bootstrap/backend.hcl`

The other three directories use the same pattern with their respective key values:
- `dev/ap-northeast-1/terraform.tfstate`
- `prod/ap-southeast-1/terraform.tfstate`
- `prod/ap-northeast-1/terraform.tfstate`

---

### 4.2 `provider.tf`

Each environment-region directory declares three AWS providers matching the flat structure. The primary provider region equals the directory's region. The secondary provider targets the opposite region. The `us_east_1` alias is declared for forward compatibility.

**Opposite region pairs:**
- `ap-southeast-1` primary → `ap-northeast-1` secondary
- `ap-northeast-1` primary → `ap-southeast-1` secondary

**Example `provider.tf` for `dev/ap-southeast-1/`:**

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

The `provider.tf` for `dev/ap-northeast-1/` is identical except `primary_region = "ap-northeast-1"` and `secondary_region = "ap-southeast-1"` are the values provided through `terraform.tfvars`.

---

### 4.3 `main.tf` — Module Instantiation and Wiring

#### Dependency Resolution

The Terraform dependency graph automatically resolves inter-module references by value. There is no true circular dependency in the module graph because:

1. `module.global_services` takes `alb_arn` from `module.compute` — Terraform will plan compute first since global_services declares an explicit dependency on compute's output.
2. `module.security` takes `alb_arn` from `module.compute` — same pattern.
3. `module.network` has no dependency on `module.security` because security groups are inside the network module.
4. `module.iam` takes `jwt_secret_arn` from `module.global_services`, `dynamodb_table_arns` from `module.database`, and `ecr_repository_arn` from `module.compute`.
5. `module.compute` takes inputs from `module.network`, `module.iam`, and `module.global_services`.

Effective planning order (determined automatically by the reference graph):
```
database ──────────────────────────────────────────────────────────────────────►┐
network ──────────────────────────────────────────────────────────────────────►iam
                                                                                  │
                                        ┌─────────────────────────────────────►compute
                                        │  (network, iam → compute)              │
                                        │                                         │
                                 global_services ◄────────────────────────────── │
                                        │         (compute.alb_arn)              │
                                        │                                         │
                                    security ◄────────────────────────────────── │
                                                  (compute.alb_arn)              │
                                                                                  │
                                    observability ◄────────────────────────────── ┘
                                                  (compute outputs)
```

**Primary region `main.tf` (e.g. `dev/ap-southeast-1/main.tf`):**

```hcl
# ─── Database (no upstream module dependencies) ───────────────────────────────
module "database" {
  source = "../../../modules/database"

  project_name                    = var.project_name
  environment                     = var.environment
  secondary_region                = var.secondary_region
  dynamodb_enable_global_tables   = var.dynamodb_enable_global_tables
  dynamodb_point_in_time_recovery = var.dynamodb_point_in_time_recovery
  dynamodb_table_users            = var.dynamodb_table_users
  dynamodb_table_categories       = var.dynamodb_table_categories
  dynamodb_table_transactions     = var.dynamodb_table_transactions
}

# ─── Network (no upstream module dependencies) ────────────────────────────────
module "network" {
  source = "../../../modules/network"

  project_name         = var.project_name
  environment          = var.environment
  primary_region       = var.primary_region
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  container_port       = var.container_port
}

# ─── IAM (depends on: database.table_arns, compute.ecr_repository_arn,
#          global_services.jwt_secret_arn) ─────────────────────────────────────
module "iam" {
  source = "../../../modules/iam"

  project_name                = var.project_name
  environment                 = var.environment
  primary_region              = var.primary_region
  github_org                  = var.github_org
  github_repo                 = var.github_repo
  create_github_oidc_provider = var.create_github_oidc_provider
  jwt_secret_arn              = module.global_services.jwt_secret_arn
  dynamodb_table_arns = [
    module.database.users_table_arn,
    module.database.categories_table_arn,
    module.database.transactions_table_arn,
  ]
  ecr_repository_arn = module.compute.ecr_repository_arn
}

# ─── Compute (depends on: network, iam, global_services) ──────────────────────
module "compute" {
  source = "../../../modules/compute"

  project_name                = var.project_name
  environment                 = var.environment
  primary_region              = var.primary_region
  ecr_image_tag_mutability    = var.ecr_image_tag_mutability
  ecs_cpu                     = var.ecs_cpu
  ecs_memory                  = var.ecs_memory
  ecs_desired_count           = var.ecs_desired_count
  ecs_min_capacity            = var.ecs_min_capacity
  ecs_max_capacity            = var.ecs_max_capacity
  container_port              = var.container_port
  backend_image_tag           = var.backend_image_tag
  log_retention_days          = var.log_retention_days
  dynamodb_table_users        = var.dynamodb_table_users
  dynamodb_table_categories   = var.dynamodb_table_categories
  dynamodb_table_transactions = var.dynamodb_table_transactions

  # From network module
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  alb_sg_id          = module.network.alb_sg_id
  ecs_sg_id          = module.network.ecs_sg_id

  # From iam module
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.iam.ecs_task_role_arn

  # From global_services module
  certificate_arn    = module.global_services.certificate_arn
  jwt_secret_arn     = module.global_services.jwt_secret_arn
  alb_logs_bucket_id = module.global_services.alb_logs_bucket_id
}

# ─── Global Services (depends on: compute.alb_arn) ────────────────────────────
module "global_services" {
  source = "../../../modules/global-services"

  project_name                  = var.project_name
  environment                   = var.environment
  primary_region                = var.primary_region
  domain_name                   = var.domain_name
  api_subdomain                 = var.api_subdomain
  frontend_subdomain            = var.frontend_subdomain
  create_route53_zone           = var.create_route53_zone
  alb_arn                       = module.compute.alb_arn
  alb_logs_bucket_force_destroy = var.environment != "prod"
  jwt_secret                    = var.jwt_secret
  github_org                    = var.github_org
  github_repo                   = var.github_repo
  github_token                  = var.github_token
  amplify_branch                = var.amplify_branch
  alert_email                   = var.alert_email
}

# ─── Security (depends on: compute.alb_arn) ───────────────────────────────────
module "security" {
  source = "../../../modules/security"

  project_name   = var.project_name
  environment    = var.environment
  alb_arn        = module.compute.alb_arn
  waf_rate_limit = var.waf_rate_limit
}

# ─── Observability (depends on: compute) ──────────────────────────────────────
module "observability" {
  source = "../../../modules/observability"

  project_name     = var.project_name
  environment      = var.environment
  primary_region   = var.primary_region
  ecs_cluster_name = module.compute.ecs_cluster_name
  ecs_service_name = module.compute.ecs_service_name
  alb_arn_suffix   = module.compute.alb_arn_suffix
  alert_email      = var.alert_email
}
```

#### Secondary Region `main.tf` (e.g. `dev/ap-northeast-1/main.tf`)

The secondary region directory instantiates all modules **except** `global_services`. Global Accelerator, ACM, Route 53, Amplify, and Secrets Manager are deployed once per environment in the primary region only. The secondary region runs its own VPC, ECS, DynamoDB (which will receive replicas from the primary), and IAM stacks. The secondary ALB can be registered as an additional endpoint in the primary region's Global Accelerator endpoint group manually or via a future enhancement — the module design supports this without changes.

For the secondary region, `certificate_arn`, `jwt_secret_arn`, and `alb_logs_bucket_id` must be supplied from the primary region's outputs (e.g., stored in SSM Parameter Store by the primary, read via data source, or passed as variable values in `terraform.tfvars`). The recommended approach is to expose these as `terraform.tfvars` variables that the operator populates after the primary region apply:

```hcl
# Variables specific to secondary region main.tf
variable "certificate_arn" {
  description = "ACM certificate ARN — copied from primary region global_services output"
  type        = string
}

variable "jwt_secret_arn" {
  description = "Secrets Manager JWT secret ARN — copied from primary region global_services output"
  type        = string
}

variable "alb_logs_bucket_id" {
  description = "ALB logs S3 bucket ID — copied from primary region global_services output"
  type        = string
}
```

The secondary region `main.tf` then instantiates: `database`, `network`, `iam`, `compute`, `security`, `observability` — with the above three values sourced from variables rather than from a local `module.global_services`.

---

### 4.4 `variables.tf` (per Environment-Region)

All variables referenced by the environment-region `main.tf`, organized by the module they feed:

```hcl
# ─── General ──────────────────────────────────────────────────────────────────
variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

# ─── Regions (feeds: provider.tf, all modules) ────────────────────────────────
variable "primary_region" {
  description = "Primary AWS region for this directory"
  type        = string
}

variable "secondary_region" {
  description = "Secondary region for DynamoDB Global Tables replication"
  type        = string
}

# ─── Networking (feeds: module.network) ───────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
}

# ─── Domain (feeds: module.global_services) ───────────────────────────────────
variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for the backend API"
  type        = string
}

variable "frontend_subdomain" {
  description = "Subdomain for the frontend"
  type        = string
}

variable "create_route53_zone" {
  description = "true to create a new Route 53 zone; false to look up existing"
  type        = bool
}

# ─── ECR / ECS (feeds: module.compute) ────────────────────────────────────────
variable "ecr_image_tag_mutability" {
  description = "Image tag mutability (MUTABLE | IMMUTABLE)"
  type        = string
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy"
  type        = string
}

variable "ecs_cpu" {
  description = "CPU units for ECS Fargate task"
  type        = number
}

variable "ecs_memory" {
  description = "Memory (MiB) for ECS Fargate task"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "ecs_min_capacity" {
  description = "Minimum ECS tasks for auto-scaling"
  type        = number
}

variable "ecs_max_capacity" {
  description = "Maximum ECS tasks for auto-scaling"
  type        = number
}

variable "container_port" {
  description = "Container port"
  type        = number
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

# ─── DynamoDB (feeds: module.database, module.compute) ────────────────────────
variable "dynamodb_table_users" {
  description = "Name of the DynamoDB users table"
  type        = string
}

variable "dynamodb_table_categories" {
  description = "Name of the DynamoDB categories table"
  type        = string
}

variable "dynamodb_table_transactions" {
  description = "Name of the DynamoDB transactions table"
  type        = string
}

variable "dynamodb_enable_global_tables" {
  description = "Enable DynamoDB Global Tables replication"
  type        = bool
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
}

# ─── Secrets (feeds: module.global_services) ──────────────────────────────────
variable "jwt_secret" {
  description = "JWT signing secret — stored in Secrets Manager"
  type        = string
  sensitive   = true
}

# ─── WAF (feeds: module.security) ─────────────────────────────────────────────
variable "waf_rate_limit" {
  description = "Maximum requests per 5-minute window per IP"
  type        = number
}

# ─── GitHub (feeds: module.iam, module.global_services) ───────────────────────
variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_token" {
  description = "GitHub OAuth token for Amplify"
  type        = string
  sensitive   = true
}

variable "create_github_oidc_provider" {
  description = "true to create GitHub OIDC provider; false if it already exists"
  type        = bool
}

variable "amplify_branch" {
  description = "Git branch to deploy via Amplify"
  type        = string
}

# ─── Alerting (feeds: module.observability) ───────────────────────────────────
variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications. Empty to disable."
  type        = string
}
```

---

### 4.5 `terraform.tfvars`

Three concrete examples demonstrating differences across environments and regions.

#### `dev/ap-southeast-1/terraform.tfvars`

```hcl
project_name   = "moneytrack"
environment    = "dev"
primary_region = "ap-southeast-1"
secondary_region = "ap-northeast-1"

# Networking — ap-southeast-1 uses 10.0.x.x range
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

# Domain
domain_name         = "moneytrack.com"
api_subdomain       = "api"
frontend_subdomain  = "www"
create_route53_zone = false

# ECR / ECS — smaller footprint for dev
ecr_image_tag_mutability = "MUTABLE"
backend_image_tag        = "latest"
ecs_cpu                  = 256
ecs_memory               = 512
ecs_desired_count        = 1
ecs_min_capacity         = 1
ecs_max_capacity         = 2
container_port           = 8080
log_retention_days       = 7

# DynamoDB
dynamodb_table_users            = "moneytrack-dev-users"
dynamodb_table_categories       = "moneytrack-dev-categories"
dynamodb_table_transactions     = "moneytrack-dev-transactions"
dynamodb_enable_global_tables   = false
dynamodb_point_in_time_recovery = false

# WAF
waf_rate_limit = 2000

# GitHub
github_org                  = "my-org"
github_repo                 = "MoneyTrack"
create_github_oidc_provider = true
amplify_branch              = "develop"

# Alerting
alert_email = ""

# Sensitive — supply via TF_VAR_ env vars or -var flags, never commit to VCS:
# jwt_secret   = "..."
# github_token = "..."
```

#### `prod/ap-southeast-1/terraform.tfvars`

```hcl
project_name     = "moneytrack"
environment      = "prod"
primary_region   = "ap-southeast-1"
secondary_region = "ap-northeast-1"

# Networking — same CIDR range as dev; prod and dev are separate accounts/VPCs
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

# Domain
domain_name         = "moneytrack.com"
api_subdomain       = "api"
frontend_subdomain  = "www"
create_route53_zone = false

# ECR / ECS — production sizing
ecr_image_tag_mutability = "IMMUTABLE"
backend_image_tag        = "v1.0.0"
ecs_cpu                  = 512
ecs_memory               = 1024
ecs_desired_count        = 2
ecs_min_capacity         = 2
ecs_max_capacity         = 6
container_port           = 8080
log_retention_days       = 30

# DynamoDB — global tables + PITR enabled in prod
dynamodb_table_users            = "moneytrack-users"
dynamodb_table_categories       = "moneytrack-categories"
dynamodb_table_transactions     = "moneytrack-transactions"
dynamodb_enable_global_tables   = true
dynamodb_point_in_time_recovery = true

# WAF
waf_rate_limit = 2000

# GitHub
github_org                  = "my-org"
github_repo                 = "MoneyTrack"
create_github_oidc_provider = false   # OIDC provider already exists in prod account
amplify_branch              = "main"

# Alerting
alert_email = "infra-alerts@moneytrack.com"

# Sensitive — supply via TF_VAR_ env vars or -var flags:
# jwt_secret   = "..."
# github_token = "..."
```

#### `dev/ap-northeast-1/terraform.tfvars`

```hcl
project_name     = "moneytrack"
environment      = "dev"
primary_region   = "ap-northeast-1"
secondary_region = "ap-southeast-1"

# Networking — ap-northeast-1 uses 10.1.x.x range to avoid CIDR conflicts
# if VPC peering or Transit Gateway is introduced later
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]

# Domain
domain_name         = "moneytrack.com"
api_subdomain       = "api"
frontend_subdomain  = "www"
create_route53_zone = false

# ECR / ECS
ecr_image_tag_mutability = "MUTABLE"
backend_image_tag        = "latest"
ecs_cpu                  = 256
ecs_memory               = 512
ecs_desired_count        = 1
ecs_min_capacity         = 1
ecs_max_capacity         = 2
container_port           = 8080
log_retention_days       = 7

# DynamoDB
dynamodb_table_users            = "moneytrack-dev-users"
dynamodb_table_categories       = "moneytrack-dev-categories"
dynamodb_table_transactions     = "moneytrack-dev-transactions"
dynamodb_enable_global_tables   = false
dynamodb_point_in_time_recovery = false

# WAF
waf_rate_limit = 2000

# GitHub
github_org                  = "my-org"
github_repo                 = "MoneyTrack"
create_github_oidc_provider = false   # OIDC provider already created by ap-southeast-1 dev
amplify_branch              = "develop"

# Alerting
alert_email = ""

# Secondary region only — supply from ap-southeast-1 dev outputs:
# certificate_arn    = "arn:aws:acm:ap-southeast-1:..."
# jwt_secret_arn     = "arn:aws:secretsmanager:ap-southeast-1:..."
# alb_logs_bucket_id = "moneytrack-dev-alb-logs"

# Sensitive:
# jwt_secret   = "..."
# github_token = "..."
```

---

### 4.6 `outputs.tf` (per Environment-Region)

All 27 outputs from the flat structure, referenced via `module.<name>.<output>`. The `jwt_secret_arn` output is marked `sensitive = true`.

```hcl
# ─── Networking ───────────────────────────────────────────────────────────────
output "vpc_id" {
  description = "ID of the primary VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "nat_gateway_public_ips" {
  description = "Elastic IPs of the NAT Gateways"
  value       = module.network.nat_gateway_public_ips
}

# ─── ECR ──────────────────────────────────────────────────────────────────────
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.compute.ecr_repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = module.compute.ecr_repository_arn
}

# ─── ECS ──────────────────────────────────────────────────────────────────────
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.compute.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.compute.ecs_service_name
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = module.compute.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = module.compute.ecs_task_role_arn
}

# ─── Load Balancer ────────────────────────────────────────────────────────────
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.compute.alb_arn
}

# ─── Global Accelerator ───────────────────────────────────────────────────────
output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator"
  value       = module.global_services.global_accelerator_dns_name
}

output "global_accelerator_static_ips" {
  description = "Static anycast IPs of the Global Accelerator"
  value       = module.global_services.global_accelerator_static_ips
}

# ─── DNS ──────────────────────────────────────────────────────────────────────
output "api_url" {
  description = "Public API URL"
  value       = module.global_services.api_url
}

output "frontend_url" {
  description = "Public frontend URL"
  value       = module.global_services.frontend_url
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.global_services.route53_zone_id
}

# ─── DynamoDB ─────────────────────────────────────────────────────────────────
output "dynamodb_users_table_name" {
  description = "DynamoDB users table name"
  value       = module.database.users_table_name
}

output "dynamodb_users_table_arn" {
  description = "DynamoDB users table ARN"
  value       = module.database.users_table_arn
}

output "dynamodb_categories_table_name" {
  description = "DynamoDB categories table name"
  value       = module.database.categories_table_name
}

output "dynamodb_categories_table_arn" {
  description = "DynamoDB categories table ARN"
  value       = module.database.categories_table_arn
}

output "dynamodb_transactions_table_name" {
  description = "DynamoDB transactions table name"
  value       = module.database.transactions_table_name
}

output "dynamodb_transactions_table_arn" {
  description = "DynamoDB transactions table ARN"
  value       = module.database.transactions_table_arn
}

# ─── Secrets Manager ──────────────────────────────────────────────────────────
output "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = module.global_services.jwt_secret_arn
  sensitive   = true
}

# ─── IAM — GitHub Actions ─────────────────────────────────────────────────────
output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role"
  value       = module.iam.github_actions_role_arn
}

# ─── Monitoring ───────────────────────────────────────────────────────────────
output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${module.observability.cloudwatch_dashboard_name}"
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = module.observability.sns_alerts_topic_arn
}

# ─── Amplify ──────────────────────────────────────────────────────────────────
output "amplify_app_id" {
  description = "AWS Amplify app ID"
  value       = module.global_services.amplify_app_id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = module.global_services.amplify_default_domain
}
```

---

## 5. Cross-Module Dependency Graph

The following diagram shows every module-to-module dependency, with the specific output → input relationship annotated on each arrow. Arrows point from the producing module to the consuming module.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ENVIRONMENT-REGION main.tf                              │
│                         (wires all modules together)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────┐
│ bootstrap │  (applied once, not part of env-region main.tf)
│           │  outputs: state_bucket_name, lock_table_name
└───────────┘
      │ (via backend.hcl / -backend-config)
      ▼ used by all env-region backend.tf

┌───────────────────────────────────────────────────────────────────────────────┐
│                           Module Dependency Graph                             │
│                                                                               │
│  ┌──────────┐                                                                 │
│  │ database │──────────────────────────────────────────────────────────────► │
│  └──────────┘  users_table_arn ──────────────────────────────────────────►   │
│                categories_table_arn ─────────────────────────────────────►   │
│                transactions_table_arn ───────────────────────────────────►   │
│                                                                    ┌─────┐   │
│                                                                    │ iam │   │
│  ┌─────────┐                                                       └─────┘   │
│  │ network │──────────────────────────────────────────────────────────────►  │
│  └─────────┘  vpc_id ────────────────────────────────────────────────────►   │
│               public_subnet_ids ─────────────────────────────────────────►   │
│               private_subnet_ids ────────────────────────────────────────►   │
│               alb_sg_id ─────────────────────────────────────────────────►   │
│               ecs_sg_id ─────────────────────────────────────────────────►   │
│               vpc_endpoint_sg_id (used internally by network module)          │
│                                                                  ┌─────────┐  │
│                                                                  │ compute │  │
│                                                                  └─────────┘  │
│                   ┌──────────────────────────────────────────────────┘        │
│  ┌─────────────────────┐          iam.ecs_task_execution_role_arn ───────►    │
│  │    global_services  │◄─────────iam.ecs_task_role_arn ───────────────►     │
│  └─────────────────────┘          global_services.certificate_arn ──────►    │
│           ▲                       global_services.jwt_secret_arn ───────►     │
│           │ compute.alb_arn       global_services.alb_logs_bucket_id ──►      │
│           │                                                                    │
│   ┌──────────┐                                                                 │
│   │ security │◄──────────────────── compute.alb_arn                           │
│   └──────────┘                                                                 │
│                                                                                │
│   ┌───────────────┐◄──────────────── compute.ecs_cluster_name                 │
│   │ observability │◄──────────────── compute.ecs_service_name                 │
│   └───────────────┘◄──────────────── compute.alb_arn_suffix                  │
│                                                                                │
│   iam ◄─────────────────────────── database.users_table_arn                   │
│       ◄─────────────────────────── database.categories_table_arn              │
│       ◄─────────────────────────── database.transactions_table_arn            │
│       ◄─────────────────────────── compute.ecr_repository_arn                 │
│       ◄─────────────────────────── global_services.jwt_secret_arn             │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Complete output → input mapping table:**

| Producer Module | Output | Consumer Module | Input Variable |
|---|---|---|---|
| `network` | `vpc_id` | `compute` | `vpc_id` |
| `network` | `public_subnet_ids` | `compute` | `public_subnet_ids` |
| `network` | `private_subnet_ids` | `compute` | `private_subnet_ids` |
| `network` | `alb_sg_id` | `compute` | `alb_sg_id` |
| `network` | `ecs_sg_id` | `compute` | `ecs_sg_id` |
| `iam` | `ecs_task_execution_role_arn` | `compute` | `ecs_task_execution_role_arn` |
| `iam` | `ecs_task_role_arn` | `compute` | `ecs_task_role_arn` |
| `global_services` | `certificate_arn` | `compute` | `certificate_arn` |
| `global_services` | `jwt_secret_arn` | `compute` | `jwt_secret_arn` |
| `global_services` | `alb_logs_bucket_id` | `compute` | `alb_logs_bucket_id` |
| `compute` | `alb_arn` | `global_services` | `alb_arn` |
| `compute` | `alb_arn` | `security` | `alb_arn` |
| `compute` | `alb_arn_suffix` | `observability` | `alb_arn_suffix` |
| `compute` | `ecs_cluster_name` | `observability` | `ecs_cluster_name` |
| `compute` | `ecs_service_name` | `observability` | `ecs_service_name` |
| `compute` | `ecr_repository_arn` | `iam` | `ecr_repository_arn` |
| `database` | `users_table_arn` | `iam` | `dynamodb_table_arns[0]` |
| `database` | `categories_table_arn` | `iam` | `dynamodb_table_arns[1]` |
| `database` | `transactions_table_arn` | `iam` | `dynamodb_table_arns[2]` |
| `global_services` | `jwt_secret_arn` | `iam` | `jwt_secret_arn` |

---

## 6. Migration Strategy

### Overview

The migration moves resources from the current flat Terraform state into per-environment per-region module-scoped state files, without destroying and re-creating any live infrastructure.

### Step 1: Apply the Bootstrap Layer

```bash
cd terraform/bootstrap
terraform init
terraform apply
# Record outputs:
#   state_bucket_name = "moneytrack-terraform-state"
#   lock_table_name   = "moneytrack-terraform-locks"
```

The bootstrap layer is applied exactly once per AWS account. Do not re-apply it during normal environment deployments. If the state bucket already exists (e.g. manually created), import it:

```bash
terraform import aws_s3_bucket.state moneytrack-terraform-state
terraform import aws_dynamodb_table.lock moneytrack-terraform-locks
```

### Step 2: Create `backend.hcl` Files

Create one `backend.hcl` file at the repository root (or in `terraform/bootstrap/`) referencing the bootstrap outputs. Do not commit this file if it will contain sensitive values.

```hcl
# terraform/backend.hcl
bucket         = "moneytrack-terraform-state"
dynamodb_table = "moneytrack-terraform-locks"
region         = "ap-southeast-1"
```

### Step 3: Copy Existing State to New State File

For the primary region (e.g. `prod/ap-southeast-1`), copy the existing flat state file into the new S3 key before running `terraform init`:

```bash
# Upload existing state to the new key location
aws s3 cp s3://moneytrack-terraform-state/moneytrack/terraform.tfstate \
          s3://moneytrack-terraform-state/prod/ap-southeast-1/terraform.tfstate
```

### Step 4: Initialize Environment-Region Directories

```bash
cd terraform/environments/prod/ap-southeast-1
terraform init -backend-config=../../../backend.hcl
```

Repeat for each environment-region directory.

### Step 5: Run `terraform state mv` to Re-address Resources

After initialization, Terraform state will contain flat resource addresses (e.g. `aws_vpc.main`). Each resource must be moved to its new module address. Run these commands in the environment-region directory.

**Module address mapping table:**

| Old flat address | New module address |
|---|---|
| `aws_vpc.main` | `module.network.aws_vpc.main` |
| `aws_subnet.public` | `module.network.aws_subnet.public` |
| `aws_subnet.private` | `module.network.aws_subnet.private` |
| `aws_internet_gateway.main` | `module.network.aws_internet_gateway.main` |
| `aws_eip.nat` | `module.network.aws_eip.nat` |
| `aws_nat_gateway.main` | `module.network.aws_nat_gateway.main` |
| `aws_route_table.public` | `module.network.aws_route_table.public` |
| `aws_route_table.private` | `module.network.aws_route_table.private` |
| `aws_route_table_association.public` | `module.network.aws_route_table_association.public` |
| `aws_route_table_association.private` | `module.network.aws_route_table_association.private` |
| `aws_vpc_endpoint.dynamodb` | `module.network.aws_vpc_endpoint.dynamodb` |
| `aws_vpc_endpoint.s3` | `module.network.aws_vpc_endpoint.s3` |
| `aws_vpc_endpoint.ecr_api` | `module.network.aws_vpc_endpoint.ecr_api` |
| `aws_vpc_endpoint.ecr_dkr` | `module.network.aws_vpc_endpoint.ecr_dkr` |
| `aws_vpc_endpoint.logs` | `module.network.aws_vpc_endpoint.logs` |
| `aws_vpc_endpoint.secretsmanager` | `module.network.aws_vpc_endpoint.secretsmanager` |
| `aws_vpc_endpoint.ssm` | `module.network.aws_vpc_endpoint.ssm` |
| `aws_security_group.alb` | `module.network.aws_security_group.alb` |
| `aws_security_group.ecs` | `module.network.aws_security_group.ecs` |
| `aws_security_group.vpc_endpoint` | `module.network.aws_security_group.vpc_endpoint` |
| `aws_wafv2_web_acl.main` | `module.security.aws_wafv2_web_acl.main` |
| `aws_wafv2_web_acl_association.alb` | `module.security.aws_wafv2_web_acl_association.alb` |
| `aws_ecr_repository.backend` | `module.compute.aws_ecr_repository.backend` |
| `aws_ecr_lifecycle_policy.backend` | `module.compute.aws_ecr_lifecycle_policy.backend` |
| `aws_ecs_cluster.main` | `module.compute.aws_ecs_cluster.main` |
| `aws_ecs_cluster_capacity_providers.main` | `module.compute.aws_ecs_cluster_capacity_providers.main` |
| `aws_cloudwatch_log_group.ecs` | `module.compute.aws_cloudwatch_log_group.ecs` |
| `aws_ecs_task_definition.backend` | `module.compute.aws_ecs_task_definition.backend` |
| `aws_lb.main` | `module.compute.aws_lb.main` |
| `aws_lb_target_group.backend` | `module.compute.aws_lb_target_group.backend` |
| `aws_lb_listener.http` | `module.compute.aws_lb_listener.http` |
| `aws_lb_listener.https` | `module.compute.aws_lb_listener.https` |
| `aws_ecs_service.backend` | `module.compute.aws_ecs_service.backend` |
| `aws_appautoscaling_target.ecs` | `module.compute.aws_appautoscaling_target.ecs` |
| `aws_appautoscaling_policy.ecs_cpu` | `module.compute.aws_appautoscaling_policy.ecs_cpu` |
| `aws_appautoscaling_policy.ecs_memory` | `module.compute.aws_appautoscaling_policy.ecs_memory` |
| `aws_dynamodb_table.users` | `module.database.aws_dynamodb_table.users` |
| `aws_dynamodb_table.categories` | `module.database.aws_dynamodb_table.categories` |
| `aws_dynamodb_table.transactions` | `module.database.aws_dynamodb_table.transactions` |
| `aws_iam_role.ecs_task_execution` | `module.iam.aws_iam_role.ecs_task_execution` |
| `aws_iam_role_policy_attachment.ecs_execution_managed` | `module.iam.aws_iam_role_policy_attachment.ecs_execution_managed` |
| `aws_iam_role_policy.ecs_execution_secrets` | `module.iam.aws_iam_role_policy.ecs_execution_secrets` |
| `aws_iam_role.ecs_task` | `module.iam.aws_iam_role.ecs_task` |
| `aws_iam_role_policy.ecs_task_dynamodb` | `module.iam.aws_iam_role_policy.ecs_task_dynamodb` |
| `aws_iam_role_policy.ecs_task_secrets` | `module.iam.aws_iam_role_policy.ecs_task_secrets` |
| `aws_iam_role_policy.ecs_task_ssm` | `module.iam.aws_iam_role_policy.ecs_task_ssm` |
| `aws_iam_role_policy.ecs_task_cloudwatch` | `module.iam.aws_iam_role_policy.ecs_task_cloudwatch` |
| `aws_iam_openid_connect_provider.github[0]` | `module.iam.aws_iam_openid_connect_provider.github[0]` |
| `aws_iam_role.github_actions` | `module.iam.aws_iam_role.github_actions` |
| `aws_iam_role_policy.github_actions_ecr` | `module.iam.aws_iam_role_policy.github_actions_ecr` |
| `aws_cloudwatch_metric_alarm.ecs_cpu_high` | `module.observability.aws_cloudwatch_metric_alarm.ecs_cpu_high` |
| `aws_cloudwatch_metric_alarm.alb_5xx` | `module.observability.aws_cloudwatch_metric_alarm.alb_5xx` |
| `aws_sns_topic.alerts` | `module.observability.aws_sns_topic.alerts` |
| `aws_sns_topic_subscription.alerts_email[0]` | `module.observability.aws_sns_topic_subscription.alerts_email[0]` |
| `aws_cloudwatch_dashboard.main` | `module.observability.aws_cloudwatch_dashboard.main` |
| `aws_secretsmanager_secret.jwt_secret` | `module.global_services.aws_secretsmanager_secret.jwt_secret` |
| `aws_secretsmanager_secret_version.jwt_secret` | `module.global_services.aws_secretsmanager_secret_version.jwt_secret` |
| `aws_acm_certificate.api` | `module.global_services.aws_acm_certificate.api` |
| `aws_acm_certificate_validation.api` | `module.global_services.aws_acm_certificate_validation.api` |
| `aws_route53_zone.main[0]` | `module.global_services.aws_route53_zone.main[0]` |
| `aws_route53_record.api_cert_validation` | `module.global_services.aws_route53_record.api_cert_validation` |
| `aws_route53_record.api` | `module.global_services.aws_route53_record.api` |
| `aws_globalaccelerator_accelerator.main` | `module.global_services.aws_globalaccelerator_accelerator.main` |
| `aws_globalaccelerator_listener.https` | `module.global_services.aws_globalaccelerator_listener.https` |
| `aws_globalaccelerator_endpoint_group.primary` | `module.global_services.aws_globalaccelerator_endpoint_group.primary` |
| `aws_s3_bucket.alb_logs` | `module.global_services.aws_s3_bucket.alb_logs` |
| `aws_s3_bucket_server_side_encryption_configuration.alb_logs` | `module.global_services.aws_s3_bucket_server_side_encryption_configuration.alb_logs` |
| `aws_s3_bucket_public_access_block.alb_logs` | `module.global_services.aws_s3_bucket_public_access_block.alb_logs` |
| `aws_s3_bucket_policy.alb_logs` | `module.global_services.aws_s3_bucket_policy.alb_logs` |
| `aws_amplify_app.frontend` | `module.global_services.aws_amplify_app.frontend` |
| `aws_amplify_branch.main` | `module.global_services.aws_amplify_branch.main` |
| `aws_amplify_domain_association.frontend` | `module.global_services.aws_amplify_domain_association.frontend` |

**Example `terraform state mv` commands (run in the env-region directory):**

```bash
terraform state mv aws_vpc.main module.network.aws_vpc.main
terraform state mv 'aws_subnet.public[0]' 'module.network.aws_subnet.public[0]'
terraform state mv 'aws_subnet.public[1]' 'module.network.aws_subnet.public[1]'
terraform state mv 'aws_subnet.private[0]' 'module.network.aws_subnet.private[0]'
terraform state mv 'aws_subnet.private[1]' 'module.network.aws_subnet.private[1]'
# ... (repeat for all resources in the table above)
terraform state mv aws_dynamodb_table.users module.database.aws_dynamodb_table.users
terraform state mv aws_lb.main module.compute.aws_lb.main
terraform state mv aws_wafv2_web_acl.main module.security.aws_wafv2_web_acl.main
terraform state mv aws_secretsmanager_secret.jwt_secret module.global_services.aws_secretsmanager_secret.jwt_secret
```

### Step 6: Import Resources Not Yet in State

If any resource exists in AWS but not in the current state file (e.g., created manually or from a separate apply), import it using the new module address:

```bash
# Example: import an existing DynamoDB table
terraform import module.database.aws_dynamodb_table.users moneytrack-users

# Example: import an existing IAM OIDC provider
terraform import 'module.iam.aws_iam_openid_connect_provider.github[0]' \
  arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

### Step 7: Run Plan to Verify Zero Diff

After all state moves:

```bash
terraform plan
```

The plan should show **no changes** (0 to add, 0 to change, 0 to destroy). If any resource shows as needing recreation, investigate the state address before applying.

### Step 8: First Apply in Correct Module Order

For net-new environments (no existing state), apply in this order to ensure upstream outputs are available:

1. `terraform apply -target=module.database` — No dependencies; creates tables
2. `terraform apply -target=module.network` — No module dependencies; creates VPC + SGs
3. `terraform apply -target=module.global_services` — Creates secrets, ACM cert, S3 bucket (ALB ARN not yet known — the Global Accelerator endpoint group will be created in this step with a forward reference that Terraform resolves via the dependency graph; if `alb_arn` is needed before compute exists, use `-target` in two passes)
4. `terraform apply -target=module.iam` — Depends on database, global_services, compute (ecr_repository_arn) — may require compute to run first; apply compute before iam in a first-time deploy:
   - First pass: `terraform apply -target=module.compute` (without iam inputs initially — use a placeholder or bootstrap role)
   - Alternatively: `terraform apply` with no targets and let Terraform resolve the full graph in one pass (recommended for clean environments)
5. `terraform apply` — Full apply; Terraform resolves the complete graph

For the simplest experience in a clean environment, run `terraform apply` without `-target` and Terraform will resolve the entire dependency graph automatically.

### Step 9: Verification Checklist

After a successful apply, verify:

- [ ] `terraform plan` shows 0 changes
- [ ] ECS service is in RUNNING state with desired count of tasks
- [ ] ALB health checks are passing (`/actuator/health` returns 200)
- [ ] HTTPS listener returns valid certificate for `api.<domain>`
- [ ] DynamoDB tables exist in both primary and secondary regions (if global tables enabled)
- [ ] CloudWatch alarms are in OK state
- [ ] SNS topic subscription confirmed (check email if `alert_email` is set)
- [ ] Global Accelerator shows the ALB as a healthy endpoint
- [ ] Amplify app shows the correct branch connected
- [ ] `terraform output jwt_secret_arn` returns the expected ARN (sensitive)
- [ ] GitHub Actions workflow can authenticate via OIDC and push to ECR

---

## 7. Future Scalability

### Adding a New Region

To add a new region (e.g. `prod/ap-east-1`):

1. Create the directory `terraform/environments/prod/ap-east-1/`
2. Copy the file structure from `terraform/environments/prod/ap-southeast-1/`
3. Create `backend.tf` with key `prod/ap-east-1/terraform.tfstate`
4. Update `provider.tf` to set `primary_region = "ap-east-1"` and `secondary_region = "ap-southeast-1"` (or the desired replica region)
5. Update `terraform.tfvars` with:
   - `primary_region = "ap-east-1"`
   - `vpc_cidr = "10.2.0.0/16"` (non-overlapping CIDR for future peering)
   - `public_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24"]`
   - `private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]`
   - Supply `certificate_arn`, `jwt_secret_arn`, `alb_logs_bucket_id` from primary region outputs
6. Initialize and apply: `terraform init -backend-config=../../../backend.hcl && terraform apply`

**No module changes are required.** No other environment-region directories are affected.

### Registering a New Region ALB with Global Accelerator

The existing `aws_globalaccelerator_endpoint_group.primary` resource in the `global-services` module uses a single `endpoint_configuration` block. To add a second region's ALB, add a second `endpoint_configuration` block to the endpoint group in the primary region's `global_services` module instantiation — or extend the module to accept a `list(object)` of endpoints. Either way, only the primary region's state is modified; secondary regions are unaffected.

### Adding a New Module

To add new infrastructure (e.g. an ElastiCache or SQS layer):

1. Create `terraform/modules/<new-module>/` with `main.tf`, `variables.tf`, `outputs.tf`
2. Add a `module "<new_module>"` block to each environment-region `main.tf` that needs it
3. No changes to existing modules are required unless cross-module wiring is needed

### CIDR Management

Each region's `terraform.tfvars` supplies non-overlapping VPC CIDRs following the pattern:

| Region | VPC CIDR |
|---|---|
| ap-southeast-1 | `10.0.0.0/16` |
| ap-northeast-1 | `10.1.0.0/16` |
| ap-east-1 (future) | `10.2.0.0/16` |
| ap-south-1 (future) | `10.3.0.0/16` |

This pattern reserves a /16 per region, supporting up to 254 additional regions before CIDR exhaustion, and enables future VPC peering or Transit Gateway without address conflicts.
