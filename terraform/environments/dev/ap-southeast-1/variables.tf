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
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
}

variable "domain_name" {
  description = "Root domain name (e.g. moneytrack.com)"
  type        = string
  default     = "moneytrack.com"
}

variable "api_subdomain" {
  description = "Subdomain for the backend API (e.g. api)"
  type        = string
  default     = "api"
}

variable "frontend_subdomain" {
  description = "Subdomain for the frontend (e.g. www)"
  type        = string
  default     = "www"
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
  default     = false
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = false
}

# Sensitive — no default. Supply via TF_VAR_jwt_secret environment variable.
variable "jwt_secret" {
  description = "JWT signing secret value stored in Secrets Manager"
  type        = string
  sensitive   = true
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

# Sensitive — no default. Supply via TF_VAR_github_token environment variable.
variable "github_token" {
  description = "GitHub personal access token for Amplify source connection"
  type        = string
  sensitive   = true
}

variable "create_github_oidc_provider" {
  description = "Set to true to create the GitHub OIDC provider; false if it already exists in the account"
  type        = bool
  default     = true
}

variable "amplify_branch" {
  description = "Git branch to connect to Amplify for frontend deployment"
  type        = string
  default     = "develop"
}

variable "alert_email" {
  description = "Email address for SNS CloudWatch alarm notifications. Empty string disables subscription."
  type        = string
  default     = ""
}
