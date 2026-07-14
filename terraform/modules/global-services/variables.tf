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

variable "alert_email" {
  description = "Email address — used only to construct API URL output"
  type        = string
}
