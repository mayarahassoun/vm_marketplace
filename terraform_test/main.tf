terraform {
  required_providers {
    hcs = {
      source  = "huaweicloud/hcs"
      version = "2.4.0"
    }
  }
}

provider "hcs" {
  region       = "tn-global-1"
  project_name = "Marketplace"
  cloud        = "mesrscloud.rnu.tn"
  access_key   = var.access_key
  secret_key   = var.secret_key
  insecure     = true
}

data "hcs_availability_zones" "zones" {}

locals {
  selected_az = data.hcs_availability_zones.zones.names[0]
}

resource "hcs_ecs_compute_instance" "vm" {
  name                      = var.instance_name
  availability_zone         = local.selected_az
  flavor_id                 = var.instance_flavor_id
  image_id                  = trimspace(var.instance_image_id)
  delete_eip_on_termination = false
  security_group_ids        = [var.security_group_id]
  system_disk_type          = var.system_disk_type
  system_disk_size          = var.system_disk_size

  network {
    uuid = var.subnet_id
  }

  admin_pass = var.administrator_password
}

resource "hcs_vpc_eip" "eip" {
  publicip {
    type = "External-01"
  }
  bandwidth {
    name       = "bw-${replace(var.instance_name, " ", "-")}"
    size       = 5
    share_type = "PER"
  }
}

resource "hcs_vpc_eip_associate" "eip_associate" {
  public_ip = hcs_vpc_eip.eip.address
  port_id   = hcs_ecs_compute_instance.vm.network[0].port
}

output "selected_az" {
  value = local.selected_az
}

output "selected_flavor_id" {
  value = var.instance_flavor_id
}

output "vm_id" {
  value = hcs_ecs_compute_instance.vm.id
}

output "public_ip" {
  value = hcs_vpc_eip.eip.address
}
