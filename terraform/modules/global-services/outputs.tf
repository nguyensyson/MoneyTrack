output "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "certificate_arn" {
  description = "ARN of the validated ACM certificate for the API subdomain"
  value       = aws_acm_certificate_validation.api.certificate_arn
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = local.route53_zone_id
}

output "alb_logs_bucket_id" {
  description = "S3 bucket ID for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "S3 bucket ARN for ALB access logs"
  value       = aws_s3_bucket.alb_logs.arn
}

output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.dns_name
}

output "global_accelerator_static_ips" {
  description = "Static anycast IPs of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.ip_sets[*].ip_addresses
}

output "api_url" {
  description = "Public API URL"
  value       = "https://${var.api_subdomain}.${var.domain_name}"
}
