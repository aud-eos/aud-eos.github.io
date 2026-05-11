provider "aws" {
  region  = "us-east-1"
  profile = "audeos"

  default_tags {
    tags = {
      ManagedBy = "OpenTofu"
      Project   = "audeos.com"
      Repo      = "aud-eos/audeos.com"
    }
  }
}
