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

variable "alb_sg_id" {
  description = "ALB security group ID"
  type        = string
}

variable "ecs_sg_id" {
  description = "ECS tasks security group ID"
  type        = string
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task IAM role"
  type        = string
}

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
