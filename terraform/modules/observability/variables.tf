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
  description = "Name for the SNS alerts topic. When empty, the module constructs the name as $${var.project_name}-$${var.environment}-alerts"
  type        = string
  default     = ""
}
