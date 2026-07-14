output "state_bucket_name" {
  description = "Name of the S3 bucket created for Terraform state storage"
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_arn" {
  description = "ARN of the S3 bucket created for Terraform state storage"
  value       = aws_s3_bucket.state.arn
}

output "lock_table_name" {
  description = "Name of the DynamoDB table created for Terraform state locking"
  value       = aws_dynamodb_table.lock.name
}
