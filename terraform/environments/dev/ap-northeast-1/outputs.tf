# =============================================================================
# dev / ap-northeast-1 — Outputs
# =============================================================================

# --- Networking ---

output "vpc_id" {
  description = "ID of the VPC"
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

# --- ECR / ECS ---

output "ecr_repository_url" {
  description = "ECR repository URL for the backend image"
  value       = module.compute.ecr_repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = module.compute.ecr_repository_arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.compute.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.compute.ecs_service_name
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  value       = module.compute.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task IAM role"
  value       = module.compute.ecs_task_role_arn
}

# --- Load Balancer ---

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.compute.alb_arn
}

# --- Global Accelerator (cross-region — no global_services in this region) ---

output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator — managed by primary region (ap-southeast-1)"
  value       = "N/A - managed by primary region (ap-southeast-1)"
}

output "global_accelerator_static_ips" {
  description = "Static IP addresses of the Global Accelerator — managed by primary region (ap-southeast-1)"
  value       = tolist([])
}

# --- Endpoints & DNS (cross-region — no global_services in this region) ---

output "api_url" {
  description = "Full HTTPS URL of the backend API — managed by primary region (ap-southeast-1)"
  value       = "N/A - managed by primary region (ap-southeast-1)"
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID — managed by primary region (ap-southeast-1)"
  value       = "N/A - managed by primary region (ap-southeast-1)"
}

# --- DynamoDB ---

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

# --- Secrets (cross-region — received as input variable) ---

output "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager — sourced from primary region (ap-southeast-1)"
  value       = var.jwt_secret_arn
  sensitive   = true
}

# --- IAM ---

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role"
  value       = module.iam.github_actions_role_arn
}

# --- Observability ---

output "cloudwatch_dashboard_url" {
  description = "Direct URL to the CloudWatch dashboard in the AWS console"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${module.observability.cloudwatch_dashboard_name}"
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = module.observability.sns_alerts_topic_arn
}
