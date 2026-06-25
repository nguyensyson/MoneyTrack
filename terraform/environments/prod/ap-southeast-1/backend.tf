terraform {
  backend "s3" {
    # Values supplied via: terraform init -backend-config=../../../backend.hcl
    # backend.hcl should contain:
    #   bucket         = "<bootstrap output: state_bucket_name>"
    #   dynamodb_table = "<bootstrap output: lock_table_name>"
    #   region         = "ap-southeast-1"
    key     = "prod/ap-southeast-1/terraform.tfstate"
    encrypt = true
  }
}
