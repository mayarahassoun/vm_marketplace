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

data "hcs_ecs_compute_flavors" "all" {}

locals {
  selected_az = data.hcs_availability_zones.zones.names[0]

  selected_flavors = [
    for f in data.hcs_ecs_compute_flavors.all.flavors : f
    if f.name == "s6.medium.2"
  ]

  selected_flavor_id = length(local.selected_flavors) > 0 ? local.selected_flavors[0].id : null
}

resource "hcs_ecs_compute_instance" "vm" {
  name              = var.instance_name
  availability_zone = local.selected_az

  flavor_id = local.selected_flavor_id
  image_id  = trimspace(var.instance_image_id)

  security_group_ids = [var.security_group_id]



system_disk_type = var.system_disk_type
system_disk_size = var.system_disk_size
 

  network {
    uuid = var.subnet_id
  }

  admin_pass = var.administrator_password
}

output "selected_az" {
  value = local.selected_az
}

output "selected_flavor_id" {
  value = local.selected_flavor_id
}

output "vm_id" {
  value = hcs_ecs_compute_instance.vm.id
}

resource "hcs_vpc_eip_associate" "eip_associate" {
  public_ip  = var.eip_address
  port_id    = hcs_ecs_compute_instance.vm.network[0].port
}

output "public_ip" {
  value = var.eip_address
}