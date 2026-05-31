# AWS region where all resources will be provisioned
variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "ap-southeast-1"
}

# Application name used as a prefix for resource naming
variable "app_name" {
  description = "Application name used to name AWS resources"
  type        = string
  default     = "moneytrack"
}

# ─── DynamoDB table names ─────────────────────────────────────────────────────

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

# ─── Application secrets ──────────────────────────────────────────────────────

# Sensitive: will not be shown in plan/apply output or state logs
variable "jwt_secret" {
  description = "Secret key used by the Spring Boot app to sign JWT tokens"
  type        = string
  sensitive   = true
}

# ─── ECS task sizing ──────────────────────────────────────────────────────────

variable "ecs_cpu" {
  description = "CPU units for the ECS Fargate task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Memory (MB) for the ECS Fargate task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Number of ECS task instances to run"
  type        = number
  default     = 1
}
