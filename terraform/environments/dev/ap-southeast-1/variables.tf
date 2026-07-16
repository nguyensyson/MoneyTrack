# =============================================================================
# dev / ap-southeast-1 — Variable Declarations
# =============================================================================

variable "project_name" {
  description = "Project name used as prefix for all resource names and tags"
  type        = string
  default     = "moneytrack"
}

variable "environment" {
  description = "Deployment environment (dev | prod)"
  type        = string
  default     = "dev"
}

variable "primary_region" {
  description = "Primary AWS region for this environment-region directory"
  type        = string
  default     = "ap-southeast-1"
}

variable "secondary_region" {
  description = "Secondary AWS region (used for DynamoDB Global Tables replication)"
  type        = string
  default     = "ap-northeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "domain_name" {
  description = "Root domain name (e.g. moneytrack.com)"
  type        = string
  default     = "sonns.cloud"
}

variable "api_subdomain" {
  description = "Subdomain for the backend API (e.g. api)"
  type        = string
  default     = "money"
}

variable "create_route53_zone" {
  description = "true = create a new Route 53 hosted zone; false = look up existing zone"
  type        = bool
  default     = false
}

variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR repository (MUTABLE | IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy to ECS (e.g. latest, v1.2.3)"
  type        = string
  default     = "latest"
}

variable "ecs_cpu" {
  description = "CPU units for the ECS Fargate task"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "Memory (MiB) for the ECS Fargate task"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS task instances"
  type        = number
  default     = 1
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8080
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 7
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
  default     = false
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = false
}

variable "waf_rate_limit" {
  description = "Maximum requests per 5-minute window per IP (WAF rate-based rule)"
  type        = number
  default     = 2000
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "nguyensyson"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "MoneyTrack"
}

variable "create_github_oidc_provider" {
  description = "Set to true to create the GitHub OIDC provider; false if it already exists in the account"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for SNS CloudWatch alarm notifications. Empty string disables subscription."
  type        = string
  default     = ""
}
