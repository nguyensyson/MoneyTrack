# =============================================================================
# GLOBAL SERVICES MODULE
# Derived from: ACM, Route 53, Global Accelerator, Secrets Manager, Amplify
#               blocks in main.tf + S3 ALB logs in storage.tf
# =============================================================================

# =============================================================================
# AWS SECRETS MANAGER — JWT Secret
# =============================================================================

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}/${var.environment}/jwt-secret"
  description             = "JWT signing secret for MoneyTrack backend"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Name      = "${var.project_name}-${var.environment}-jwt-secret"
    Project   = var.project_name
    Environment = var.environment
    ManagedBy = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# =============================================================================
# ACM — TLS Certificate (in primary region, for ALB)
# =============================================================================

resource "aws_acm_certificate" "api" {
  domain_name       = "${var.api_subdomain}.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-cert"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# =============================================================================
# ROUTE 53 — Hosted Zone
# =============================================================================

# Look up existing zone when create_route53_zone = false
data "aws_route53_zone" "main" {
  count        = var.create_route53_zone ? 0 : 1
  name         = "${var.domain_name}."
  private_zone = false
}

# Create new zone when create_route53_zone = true
resource "aws_route53_zone" "main" {
  count = var.create_route53_zone ? 1 : 0
  name  = var.domain_name

  tags = {
    Name        = "${var.project_name}-${var.environment}-zone"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

locals {
  route53_zone_id = var.create_route53_zone ? (
    aws_route53_zone.main[0].zone_id
  ) : data.aws_route53_zone.main[0].zone_id
}

# =============================================================================
# ROUTE 53 — ACM DNS Validation Records
# =============================================================================

resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = local.route53_zone_id
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
}

# =============================================================================
# ROUTE 53 — API Record (A alias → Global Accelerator)
# =============================================================================

resource "aws_route53_record" "api" {
  zone_id = local.route53_zone_id
  name    = "${var.api_subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_globalaccelerator_accelerator.main.dns_name
    zone_id                = "Z2BJ6XQ5FK7U4H" # Global Accelerator hosted zone ID (fixed)
    evaluate_target_health = true
  }
}

# =============================================================================
# S3 — ALB Access Logs
# (must be defined before Global Accelerator which references the bucket)
# =============================================================================

resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${var.project_name}-${var.environment}-alb-logs"
  force_destroy = var.alb_logs_bucket_force_destroy

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-logs"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { AWS = data.aws_elb_service_account.main.arn }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.alb_logs.arn}/alb/AWSLogs/*"
      }
    ]
  })
}

# =============================================================================
# AWS GLOBAL ACCELERATOR
# Routes api.<domain> to the nearest ALB across regions
# =============================================================================

resource "aws_globalaccelerator_accelerator" "main" {
  name            = "${var.project_name}-${var.environment}-ga"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.alb_logs.bucket
    flow_logs_s3_prefix = "global-accelerator"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-global-accelerator"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_globalaccelerator_listener" "https" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  client_affinity = "NONE"
  protocol        = "TCP"

  port_range {
    from_port = 443
    to_port   = 443
  }

  port_range {
    from_port = 80
    to_port   = 80
  }
}

resource "aws_globalaccelerator_endpoint_group" "primary" {
  listener_arn            = aws_globalaccelerator_listener.https.id
  endpoint_group_region   = var.primary_region
  traffic_dial_percentage = 100

  endpoint_configuration {
    endpoint_id                    = var.alb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }

  health_check_path             = "/actuator/health"
  health_check_port             = 443
  health_check_protocol         = "HTTPS"
  health_check_interval_seconds = 30
  threshold_count               = 3
}

# =============================================================================
# AWS AMPLIFY — Frontend hosting
# Amplify handles build + deploy from GitHub automatically
# =============================================================================

resource "aws_amplify_app" "frontend" {
  name       = "${var.project_name}-${var.environment}-frontend"
  repository = "https://github.com/${var.github_org}/${var.github_repo}"

  # GitHub OAuth token
  oauth_token = var.github_token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - pnpm install
        build:
          commands:
            - pnpm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  environment_variables = {
    NEXT_PUBLIC_API_URL = "https://${var.api_subdomain}.${var.domain_name}"
    NODE_ENV            = var.environment
  }

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-amplify"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = var.amplify_branch

  framework = "Next.js - SSG"
  stage     = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  enable_auto_build = true

  environment_variables = {
    NEXT_PUBLIC_API_URL = "https://${var.api_subdomain}.${var.domain_name}"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-amplify-branch"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_amplify_domain_association" "frontend" {
  app_id      = aws_amplify_app.frontend.id
  domain_name = var.domain_name

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.frontend_subdomain
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.api_subdomain
  }
}
