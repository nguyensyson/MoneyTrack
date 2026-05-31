# =============================================================================
# GENERAL
# =============================================================================

variable "project_name" {
  description = "Project name used as prefix for all resource names"
  type        = string
  default     = "moneytrack"
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

# =============================================================================
# REGIONS
# =============================================================================

variable "primary_region" {
  description = "Primary AWS region for all resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DynamoDB Global Tables replication"
  type        = string
  default     = "ap-northeast-1"
}

# =============================================================================
# NETWORKING
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for the primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ, for ECS Fargate)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# =============================================================================
# DOMAIN & CERTIFICATES
# =============================================================================

variable "domain_name" {
  description = "Root domain name (e.g. moneytrack.com). Leave empty to skip Route 53 / ACM."
  type        = string
  default     = "moneytrack.com"
}

variable "frontend_subdomain" {
  description = "Subdomain for the frontend (e.g. www)"
  type        = string
  default     = "www"
}

variable "api_subdomain" {
  description = "Subdomain for the backend API (e.g. api)"
  type        = string
  default     = "api"
}

variable "create_route53_zone" {
  description = "Set to true to create a new Route 53 hosted zone. Set to false if the zone already exists."
  type        = bool
  default     = false
}

# =============================================================================
# ECR
# =============================================================================

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR (MUTABLE | IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy to ECS (e.g. latest, v1.2.3)"
  type        = string
  default     = "latest"
}

# =============================================================================
# ECS / FARGATE
# =============================================================================

variable "ecs_cpu" {
  description = "CPU units for the ECS Fargate task (256 | 512 | 1024 | 2048 | 4096)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Memory (MiB) for the ECS Fargate task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS task instances"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 4
}

variable "container_port" {
  description = "Port the Spring Boot container listens on"
  type        = number
  default     = 8080
}

# =============================================================================
# DYNAMODB
# =============================================================================

variable "dynamodb_table_users" {
  description = "Name of the DynamoDB users table"
  type        = string
  default     = "moneytrack-users"
}

variable "dynamodb_table_categories" {
  description = "Name of the DynamoDB categories table"
  type        = string
  default     = "moneytrack-categories"
}

variable "dynamodb_table_transactions" {
  description = "Name of the DynamoDB transactions table"
  type        = string
  default     = "moneytrack-transactions"
}

variable "dynamodb_enable_global_tables" {
  description = "Enable DynamoDB Global Tables replication to secondary region"
  type        = bool
  default     = true
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = true
}

# =============================================================================
# SECRETS
# =============================================================================

variable "jwt_secret" {
  description = "JWT signing secret — stored in AWS Secrets Manager, injected into ECS via environment"
  type        = string
  sensitive   = true
}

# =============================================================================
# CLOUDWATCH / LOGGING
# =============================================================================

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 30
}

# =============================================================================
# WAF
# =============================================================================

variable "waf_rate_limit" {
  description = "Maximum requests per 5-minute window per IP (WAF rate-based rule)"
  type        = number
  default     = 2000
}

# =============================================================================
# GITHUB (for OIDC + Amplify)
# =============================================================================

variable "github_org" {
  description = "GitHub organization or username (e.g. my-org)"
  type        = string
  default     = "my-org"
}

variable "github_repo" {
  description = "GitHub repository name (e.g. MoneyTrack)"
  type        = string
  default     = "MoneyTrack"
}

variable "github_token" {
  description = "GitHub personal access token for Amplify (stored in Secrets Manager, not tfvars)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "create_github_oidc_provider" {
  description = "Set to true to create the GitHub OIDC provider. Set to false if it already exists in the account."
  type        = bool
  default     = true
}

variable "amplify_branch" {
  description = "Git branch to deploy via Amplify (e.g. main)"
  type        = string
  default     = "main"
}

# =============================================================================
# ALERTING
# =============================================================================

variable "alert_email" {
  description = "Email address to receive CloudWatch alarm notifications. Leave empty to skip."
  type        = string
  default     = ""
}
