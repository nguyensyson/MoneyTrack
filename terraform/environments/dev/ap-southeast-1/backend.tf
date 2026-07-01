terraform {
  backend "s3" {
    bucket         = "moneytrack-terraform-state"
    dynamodb_table = "moneytrack-terraform-locks"
    region         = "ap-southeast-1"
    key            = "dev/ap-southeast-1/terraform.tfstate"
    encrypt        = true
  }
}
