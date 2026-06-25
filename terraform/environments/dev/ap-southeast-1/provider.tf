terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider — ap-southeast-1 (Singapore)
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary provider alias — ap-northeast-1 (Tokyo)
# Used by Database module for DynamoDB Global Tables replication
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

# us-east-1 provider alias
# Declared for forward compatibility (e.g. CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
