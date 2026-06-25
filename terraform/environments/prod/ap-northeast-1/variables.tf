# =============================================================================
# prod / ap-northeast-1 — Variable Declarations (Secondary Region)
#
# This directory does not instantiate global_services.
# Variables for jwt_secret, github_token, domain_name, api_subdomain,
# frontend_subdomain, create_route53_zone, and amplify_branch are omitted
# as they are only needed by the global_services module in the primary region.
# =============================================================================

variable "project_name" {
  description = "Project name used as prefix for all resource names and tags"
  type        = string
  default     = "moneytrack"
}

variable "environment" {
  description = "Deployment environment (dev | prod)"
  type        = string
  default     = "prod"
}

variable "primary_region" {
  description = "Primary AWS region for this environment-region directory"
  type        = string
  default     = "ap-northeast-1"
}

variable "secondary_region" {
  description = "Secondary AWS region (used for DynamoDB Global Tables replication)"
  type        = string
  default     = "ap-southeast-1"
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

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR repository (MUTABLE | IMMUTABLE)"
  type        = string
  default     = "IMMUTABLE"
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy to ECS (e.g. latest, v1.2.3)"
  type        = string
  default     = "v1.0.0"
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
  default     = 8080
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
}

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

variable "waf_rate_limit" {
  description = "Maximum requests per 5-minute window per IP (WAF rate-based rule)"
  type        = number
  default     = 2000
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "moneytrack"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "MoneyTrack_BE"
}

variable "create_github_oidc_provider" {
  description = "Set to true to create the GitHub OIDC provider; false if it already exists in the account"
  type        = bool
  default     = false
}

variable "amplify_branch" {
  description = "Git branch to connect to Amplify for the frontend deployment"
  type        = string
  default     = "main"
}

variable "alert_email" {
  description = "Email address for SNS CloudWatch alarm notifications. Empty string disables subscription."
  type        = string
  default     = ""
}

# =============================================================================
# Cross-region inputs — populate from prod/ap-southeast-1 terraform output:
#   cd terraform/environments/prod/ap-southeast-1
#   terraform output certificate_arn
#   terraform output alb_logs_bucket_id
#   terraform output -raw jwt_secret_arn   (sensitive)
# =============================================================================

variable "certificate_arn" {
  description = "ACM certificate ARN — sourced from primary region (prod/ap-southeast-1) terraform output"
  type        = string
}

variable "jwt_secret_arn" {
  description = "Secrets Manager ARN of the JWT secret — sourced from primary region (prod/ap-southeast-1) terraform output"
  type        = string
}

variable "alb_logs_bucket_id" {
  description = "S3 bucket ID for ALB access logs — sourced from primary region (prod/ap-southeast-1) terraform output"
  type        = string
}
