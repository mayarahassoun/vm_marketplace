import httpx
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.session import get_db
from app.models.virtual_machine import VirtualMachine
from datetime import datetime

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])


@router.get("/{vm_id}")
async def get_metrics(vm_id: int, db: Session = Depends(get_db)):
    vm = db.query(VirtualMachine).filter(VirtualMachine.id == vm_id).first()
    if not vm:
        raise HTTPException(status_code=404, detail="VM not found")

    if not vm.netdata_url:
        raise HTTPException(status_code=404, detail="Netdata not installed on this VM")

    netdata_base = vm.netdata_url  # ex: http://193.95.31.98:19999

    try:
        async with httpx.AsyncClient(timeout=5) as client:

            # CPU
            cpu_res = await client.get(
                f"{netdata_base}/api/v1/data?chart=system.cpu&points=20&format=json"
            )
            cpu_data = cpu_res.json()

            # RAM
            ram_res = await client.get(
                f"{netdata_base}/api/v1/data?chart=system.ram&points=20&format=json"
            )
            ram_data = ram_res.json()

            # Network
            net_res = await client.get(
                f"{netdata_base}/api/v1/data?chart=system.net&points=20&format=json"
            )
            net_data = net_res.json()

        def parse_metric(data: dict, key: str = None) -> list:
            points = []
            labels = data.get("labels", [])
            result = data.get("data", [])

            for row in result:
                timestamp = row[0]
                time_str = datetime.fromtimestamp(timestamp).strftime("%H:%M:%S")

                if key and key in labels:
                    idx = labels.index(key)
                    value = row[idx] or 0
                else:
                    # Somme de toutes les valeurs sauf timestamp
                    value = sum(v for v in row[1:] if v is not None)

                points.append({"time": time_str, "value": round(value, 2)})

            return points

        return {
            "cpu": parse_metric(cpu_data),
            "ram": parse_metric(ram_data, "used"),
            "network_in": parse_metric(net_data, "received"),
            "network_out": parse_metric(net_data, "sent"),
        }

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Netdata on {netdata_base}: {str(e)}"
        )