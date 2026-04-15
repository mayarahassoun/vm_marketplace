resource "hcs_ecs_compute_instance" "vm" {
  name              = var.instance_name
  availability_zone = var.availability_zone

  flavor_name = var.instance_flavor_name
  image_id    = trimspace(var.instance_image_id)

  security_groups = [
    var.security_group_name
  ]

  network {
  uuid = var.network_id
}

  admin_pass = var.administrator_password
}