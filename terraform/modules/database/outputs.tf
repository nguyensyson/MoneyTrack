output "users_table_name" {
  description = "DynamoDB users table name"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "DynamoDB users table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "categories_table_name" {
  description = "DynamoDB categories table name"
  value       = aws_dynamodb_table.categories.name
}

output "categories_table_arn" {
  description = "DynamoDB categories table ARN"
  value       = aws_dynamodb_table.categories.arn
}

output "transactions_table_name" {
  description = "DynamoDB transactions table name"
  value       = aws_dynamodb_table.transactions.name
}

output "transactions_table_arn" {
  description = "DynamoDB transactions table ARN"
  value       = aws_dynamodb_table.transactions.arn
}
