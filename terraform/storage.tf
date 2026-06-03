# =============================================================================
# NOTE: Frontend S3 bucket removed — Amplify manages its own hosting.
# =============================================================================

# =============================================================================
# S3 — ALB Access Logs
# =============================================================================

resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${var.project_name}-${var.environment}-alb-logs"
  force_destroy = var.environment != "prod"

  tags = { Name = "${var.project_name}-${var.environment}-alb-logs" }
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

# ALB requires a specific bucket policy to write access logs
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
# NOTE: Frontend is hosted via AWS Amplify (see main.tf)
# Amplify manages its own CloudFront distribution internally.
# S3+CloudFront setup has been removed to avoid CNAMEAlreadyExists conflict.
# =============================================================================
