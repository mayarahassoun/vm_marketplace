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

# ─── Master node ────────────────────────────────────────────────────────────

resource "hcs_ecs_compute_instance" "master" {
  name                      = "${var.cluster_name}-master"
  availability_zone         = local.selected_az
  flavor_id                 = var.master_flavor_id
  image_id                  = trimspace(var.image_id)
  delete_eip_on_termination = false
  security_group_ids        = [var.security_group_id]
  system_disk_type          = var.system_disk_type
  system_disk_size          = var.system_disk_size

  network {
    uuid = var.subnet_id
  }

  admin_pass = var.administrator_password
}

resource "hcs_vpc_eip" "master_eip" {
  depends_on = [hcs_ecs_compute_instance.master]

  publicip {
    type = "External-01"
  }
  bandwidth {
    name       = "bw-${var.cluster_name}-master"
    size       = 5
    share_type = "PER"
  }
}

resource "hcs_vpc_eip_associate" "master_eip_assoc" {
  public_ip = hcs_vpc_eip.master_eip.address
  port_id   = hcs_ecs_compute_instance.master.network[0].port
}

# ─── Worker nodes ────────────────────────────────────────────────────────────

resource "hcs_ecs_compute_instance" "workers" {
  count                     = var.worker_count
  name                      = "${var.cluster_name}-worker-${count.index + 1}"
  availability_zone         = local.selected_az
  flavor_id                 = var.worker_flavor_id
  image_id                  = trimspace(var.image_id)
  delete_eip_on_termination = false
  security_group_ids        = [var.security_group_id]
  system_disk_type          = var.system_disk_type
  system_disk_size          = var.system_disk_size

  network {
    uuid = var.subnet_id
  }

  admin_pass = var.administrator_password
}

resource "hcs_vpc_eip" "worker_eips" {
  count      = var.worker_count
  depends_on = [hcs_ecs_compute_instance.workers]

  publicip {
    type = "External-01"
  }
  bandwidth {
    name       = "bw-${var.cluster_name}-worker-${count.index + 1}"
    size       = 5
    share_type = "PER"
  }
}

resource "hcs_vpc_eip_associate" "worker_eip_assocs" {
  count     = var.worker_count
  public_ip = hcs_vpc_eip.worker_eips[count.index].address
  port_id   = hcs_ecs_compute_instance.workers[count.index].network[0].port
}

# ─── Outputs ─────────────────────────────────────────────────────────────────

output "master_id" {
  value = hcs_ecs_compute_instance.master.id
}

output "master_public_ip" {
  value = hcs_vpc_eip.master_eip.address
}

output "master_private_ip" {
  value = hcs_ecs_compute_instance.master.network[0].fixed_ip_v4
}

output "worker_ids" {
  value = [for w in hcs_ecs_compute_instance.workers : w.id]
}

output "worker_public_ips" {
  value = [for eip in hcs_vpc_eip.worker_eips : eip.address]
}

output "worker_private_ips" {
  value = [for w in hcs_ecs_compute_instance.workers : w.network[0].fixed_ip_v4]
}
