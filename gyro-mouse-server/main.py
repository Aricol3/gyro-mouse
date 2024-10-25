import socket
import qrcode
import pyautogui
from flask import Flask, send_file
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)


def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        s.connect(('10.254.254.254', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


@app.route('/qrcode')
def generate_qr():
    ip_address = get_ip()
    print(ip_address)
    port = 3000
    connection_info = f'ws://{ip_address}:{port}'

    qr = qrcode.make(connection_info)
    qr.save('gyro_connection_qr.png')

    return send_file('gyro_connection_qr.png', mimetype='image/png')


@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('message', {'data': 'Connected to the server'})


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('gyroData')
def handle_gyro_data(data):
    print(f'Received gyroscope data: {data}')
    x = data.get('x', 0)
    z = data.get('z', 0)


    sensitivity = 20
    current_x, current_y = pyautogui.position()

    new_y = current_y - x * sensitivity
    new_x = current_x - z * sensitivity

    pyautogui.moveTo(new_x, new_y, _pause=False)


if __name__ == '__main__':
    ip_address = get_ip()
    socketio.run(app, host='0.0.0.0', port=3000)
