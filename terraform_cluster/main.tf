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

  # Resolve master flavor: match by name OR id (same pattern as terraform_test)
  master_flavors = [
    for f in data.hcs_ecs_compute_flavors.all.flavors : f
    if f.id == var.master_flavor_id || f.name == var.master_flavor_id
  ]
  resolved_master_flavor_id = length(local.master_flavors) > 0 ? local.master_flavors[0].id : var.master_flavor_id

  # Resolve worker flavor
  worker_flavors = [
    for f in data.hcs_ecs_compute_flavors.all.flavors : f
    if f.id == var.worker_flavor_id || f.name == var.worker_flavor_id
  ]
  resolved_worker_flavor_id = length(local.worker_flavors) > 0 ? local.worker_flavors[0].id : var.worker_flavor_id
}

# ─── Master node ────────────────────────────────────────────────────────────

resource "hcs_ecs_compute_instance" "master" {
  name                      = "${var.cluster_name}-master"
  availability_zone         = local.selected_az
  flavor_id                 = local.resolved_master_flavor_id
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
  flavor_id                 = local.resolved_worker_flavor_id
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

# ─── Outputs ─────────────────────────────────────────────────────────────────
# Note: workers are only reachable via the master node (jump host). No EIP needed.

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

output "worker_private_ips" {
  value = [for w in hcs_ecs_compute_instance.workers : w.network[0].fixed_ip_v4]
}
