# Backend configuration for dev/ap-southeast-1
#
# S3 bucket name and DynamoDB table name are NOT hard-coded here.
# Supply them at init time using a backend.hcl partial config:
#
#   terraform init -backend-config=../../../backend.hcl
#
# Where backend.hcl contains:
#   bucket         = "<output from terraform/bootstrap>"
#   dynamodb_table = "<output from terraform/bootstrap>"
#   region         = "ap-southeast-1"
#
# See terraform/MIGRATION.md for full bootstrap + migration instructions.

terraform {
  backend "s3" {
    key     = "dev/ap-southeast-1/terraform.tfstate"
    encrypt = true
  }
}
