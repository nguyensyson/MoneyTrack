# =============================================================================
# OUTPUTS — MoneyTrack Infrastructure
# =============================================================================

# ─── Networking ───────────────────────────────────────────────────────────────

output "vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets (ALB, NAT GW)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (ECS Fargate)"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_public_ips" {
  description = "Elastic IPs of the NAT Gateways (whitelist these in external services)"
  value       = aws_eip.nat[*].public_ip
}

# ─── ECR ──────────────────────────────────────────────────────────────────────

output "ecr_repository_url" {
  description = "ECR repository URL — use this to tag and push Docker images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}

# ─── ECS ──────────────────────────────────────────────────────────────────────

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role (DynamoDB access)"
  value       = aws_iam_role.ecs_task.arn
}

# ─── Load Balancer ────────────────────────────────────────────────────────────

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# ─── Global Accelerator ───────────────────────────────────────────────────────

output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator (points to api.moneytrack.com)"
  value       = aws_globalaccelerator_accelerator.main.dns_name
}

output "global_accelerator_static_ips" {
  description = "Static anycast IPs of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.ip_sets[*].ip_addresses
}

# ─── DNS ──────────────────────────────────────────────────────────────────────

output "api_url" {
  description = "Public API URL"
  value       = "https://${var.api_subdomain}.${var.domain_name}"
}

output "frontend_url" {
  description = "Public frontend URL"
  value       = "https://${var.frontend_subdomain}.${var.domain_name}"
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = local.route53_zone_id
}

# ─── CloudFront ───────────────────────────────────────────────────────────────

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (use for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

# ─── S3 ───────────────────────────────────────────────────────────────────────

output "frontend_s3_bucket" {
  description = "S3 bucket name for frontend static assets"
  value       = aws_s3_bucket.frontend.id
}

# ─── DynamoDB ─────────────────────────────────────────────────────────────────

output "dynamodb_users_table_name" {
  description = "DynamoDB users table name"
  value       = aws_dynamodb_table.users.name
}

output "dynamodb_users_table_arn" {
  description = "DynamoDB users table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "dynamodb_categories_table_name" {
  description = "DynamoDB categories table name"
  value       = aws_dynamodb_table.categories.name
}

output "dynamodb_categories_table_arn" {
  description = "DynamoDB categories table ARN"
  value       = aws_dynamodb_table.categories.arn
}

output "dynamodb_transactions_table_name" {
  description = "DynamoDB transactions table name"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_transactions_table_arn" {
  description = "DynamoDB transactions table ARN"
  value       = aws_dynamodb_table.transactions.arn
}

# ─── Secrets Manager ──────────────────────────────────────────────────────────

output "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

# ─── IAM — GitHub Actions ─────────────────────────────────────────────────────

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role (use in GitHub Actions workflow)"
  value       = aws_iam_role.github_actions.arn
}

# ─── Monitoring ───────────────────────────────────────────────────────────────

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

# ─── Amplify ──────────────────────────────────────────────────────────────────

output "amplify_app_id" {
  description = "AWS Amplify app ID"
  value       = aws_amplify_app.frontend.id
}

output "amplify_default_domain" {
  description = "Amplify default domain (before custom domain is configured)"
  value       = aws_amplify_app.frontend.default_domain
}
