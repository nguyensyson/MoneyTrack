# =============================================================================
# DYNAMODB — Users Table
# PK: userId (S)
# GSI: email-index (PK: email)
# =============================================================================

resource "aws_dynamodb_table" "users" {
  name             = var.dynamodb_table_users
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "userId"
  stream_enabled   = var.dynamodb_enable_global_tables
  stream_view_type = var.dynamodb_enable_global_tables ? "NEW_AND_OLD_IMAGES" : null

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true # AWS-managed key (SSE-S3); set kms_key_arn for CMK
  }

  dynamic "replica" {
    for_each = var.dynamodb_enable_global_tables ? [var.secondary_region] : []
    content {
      region_name = replica.value
    }
  }

  tags = { Name = var.dynamodb_table_users }

  lifecycle {
    prevent_destroy = true # Protect production data
  }
}

# =============================================================================
# DYNAMODB — Categories Table
# PK: categoryId (S)
# GSI: type-index (PK: type)
# =============================================================================

resource "aws_dynamodb_table" "categories" {
  name             = var.dynamodb_table_categories
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "categoryId"
  stream_enabled   = var.dynamodb_enable_global_tables
  stream_view_type = var.dynamodb_enable_global_tables ? "NEW_AND_OLD_IMAGES" : null

  attribute {
    name = "categoryId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  global_secondary_index {
    name            = "type-index"
    hash_key        = "type"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  dynamic "replica" {
    for_each = var.dynamodb_enable_global_tables ? [var.secondary_region] : []
    content {
      region_name = replica.value
    }
  }

  tags = { Name = var.dynamodb_table_categories }

  lifecycle {
    prevent_destroy = true
  }
}

# =============================================================================
# DYNAMODB — Transactions Table
# PK: transactionId (S)
# GSI: userId-date-index (PK: userId, SK: date)
# =============================================================================

resource "aws_dynamodb_table" "transactions" {
  name             = var.dynamodb_table_transactions
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transactionId"
  stream_enabled   = var.dynamodb_enable_global_tables
  stream_view_type = var.dynamodb_enable_global_tables ? "NEW_AND_OLD_IMAGES" : null

  attribute {
    name = "transactionId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-date-index"
    hash_key        = "userId"
    range_key       = "date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  dynamic "replica" {
    for_each = var.dynamodb_enable_global_tables ? [var.secondary_region] : []
    content {
      region_name = replica.value
    }
  }

  tags = { Name = var.dynamodb_table_transactions }

  lifecycle {
    prevent_destroy = true
  }
}
