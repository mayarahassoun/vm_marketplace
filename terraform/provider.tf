terraform {
  required_version = ">= 0.14.0"

  required_providers {
    hcs = {
      source  = "huaweicloud/hcs"
      version = "2.4.0"
    }
  }
}

provider "hcs" {
  auth_url     = "https://console.mesrscloud.rnu.tn/v3"
  region       = "mesrscloud_tunis"
  project_name = "Marketplace"

  access_key = var.access_key
  secret_key = var.secret_key

  insecure = true
}