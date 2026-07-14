variable "project_name" {
  description = "Project name used in resource tags"
  type        = string
  default     = "moneytrack"
}

variable "aws_region" {
  description = "AWS region where the state bucket and lock table are created"
  type        = string
  default     = "ap-southeast-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket used to store Terraform state"
  type        = string
  default     = "moneytrack-terraform-state"
}

variable "lock_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking"
  type        = string
  default     = "moneytrack-terraform-locks"
}
