# =============================================================================
# OUTPUTS (Req 6.1, 6.2, 6.3)
# =============================================================================

# Public API URL — use this to reach the backend after deployment (Req 6.1)
output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer (API entry point)"
  value       = aws_lb.main.dns_name
}

# ECR repository URL — use this when tagging and pushing the Docker image (Req 6.2)
output "ecr_repository_url" {
  description = "ECR repository URL for pushing the backend Docker image"
  value       = aws_ecr_repository.app.repository_url
}

# RDS endpoint — useful for debugging or running migrations directly (Req 6.3)
output "rds_endpoint" {
  description = "RDS MySQL instance endpoint (host:port)"
  value       = aws_db_instance.mysql.endpoint
}
