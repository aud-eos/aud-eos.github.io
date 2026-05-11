terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "audeos-tofu-state"
    key            = "audeos-com/terraform.tfstate"
    region         = "us-west-2"
    profile        = "audeos"
    dynamodb_table = "audeos-tofu-locks"
    encrypt        = true
  }
}
