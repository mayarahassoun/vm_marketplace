import asyncio
import paramiko
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/api/ssh", tags=["SSH"])


@router.websocket("/ws")
async def ssh_terminal(websocket: WebSocket):
    await websocket.accept()

    # Récupère les credentials depuis le premier message
    creds = await websocket.receive_json()
    host = creds.get("host")
    password = creds.get("password")
    username = creds.get("username", "root")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(
            hostname=host,
            username=username,
            password=password,
            timeout=10,
        )

        channel = ssh.invoke_shell(term="xterm", width=220, height=50)
        channel.setblocking(False)

        await websocket.send_text("\r\n✅ Connected to " + host + "\r\n\r\n")

        async def read_ssh():
            while True:
                await asyncio.sleep(0.05)
                try:
                    if channel.recv_ready():
                        data = channel.recv(4096).decode("utf-8", errors="replace")
                        await websocket.send_text(data)
                    if channel.exit_status_ready():
                        await websocket.send_text("\r\n🔌 Connection closed.\r\n")
                        break
                except Exception:
                    break

        async def read_ws():
            while True:
                try:
                    data = await websocket.receive_text()
                    channel.send(data)
                except WebSocketDisconnect:
                    break
                except Exception:
                    break

        await asyncio.gather(read_ssh(), read_ws())

    except Exception as e:
        await websocket.send_text(f"\r\n❌ Error: {str(e)}\r\n")

    finally:
        ssh.close()
        try:
            await websocket.close()
        except Exception:
            pass