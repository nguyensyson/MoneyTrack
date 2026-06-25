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
  description = "Set to true to create the GitHub OIDC provider; false if it already exists in the account"
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
