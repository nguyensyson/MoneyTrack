# =============================================================================
# OUTPUTS
# =============================================================================

# Public API URL — use this to reach the backend after deployment
output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer (API entry point)"
  value       = aws_lb.main.dns_name
}

# ECR repository URL — use this when tagging and pushing the Docker image
output "ecr_repository_url" {
  description = "ECR repository URL for pushing the backend Docker image"
  value       = aws_ecr_repository.app.repository_url
}

# DynamoDB table ARNs — useful for IAM policy debugging
output "dynamodb_users_table_arn" {
  description = "ARN of the DynamoDB users table"
  value       = aws_dynamodb_table.users.arn
}

output "dynamodb_categories_table_arn" {
  description = "ARN of the DynamoDB categories table"
  value       = aws_dynamodb_table.categories.arn
}

output "dynamodb_transactions_table_arn" {
  description = "ARN of the DynamoDB transactions table"
  value       = aws_dynamodb_table.transactions.arn
}
