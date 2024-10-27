use tokio::net::UdpSocket;
use std::env;
use std::net::SocketAddr;
use log::{error, info};
use mouse_rs::{types::keys::Keys, Mouse};
use qr2term::print_qr;
use tokio::time::Instant;
use local_ip_address::local_ip;
use serde_json::Value;

#[tokio::main]
async fn main() {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let local_ip = local_ip().unwrap();
    let port = "49152";
    let url = format!("{}:{}", local_ip, port);
    print_qr(&url).unwrap();

    let addr = env::args().nth(1).unwrap_or_else(|| format!("{}:{}", local_ip, port).to_string());
    let addr: SocketAddr = addr.parse().expect("Invalid address");
    let socket = UdpSocket::bind(&addr).await.expect("Failed to bind");

    info!("Listening on: {}", addr);

    let mut buf = [0u8; 1024];
    loop {
        let (len, src) = socket.recv_from(&mut buf).await.expect("Failed to receive data");
        let msg = String::from_utf8_lossy(&buf[..len]);
        info!("Received from {}: {}", src, msg);

        if msg.starts_with("{\"event\":\"gyroData\"") {
            handle_gyro_data(&msg).await;
        } else if msg.starts_with("{\"event\":\"leftClick\"") {
            handle_click("left").await;
        } else if msg.starts_with("{\"event\":\"rightClick\"") {
            handle_click("right").await;
        } else {
            info!("Received other message: {:?}", msg);
        }
    }
}

async fn handle_gyro_data(msg: &str) {
    let gyro_data: Value = serde_json::from_str(msg).unwrap();
    let x = gyro_data["data"]["x"].as_f64().unwrap_or(0.0);
    let y = gyro_data["data"]["y"].as_f64().unwrap_or(0.0);
    let z = gyro_data["data"]["z"].as_f64().unwrap_or(0.0);

    move_mouse(x, z).await;
}

async fn handle_click(button: &str) {
    let mouse = Mouse::new();

    match button {
        "left" => {
            if let Err(err) = mouse.click(&Keys::LEFT) {
                error!("Failed to perform left click: {}", err);
            } else {
                info!("Performed left click");
            }
        }
        "right" => {
            if let Err(err) = mouse.click(&Keys::RIGHT) {
                error!("Failed to perform right click: {}", err);
            } else {
                info!("Performed right click");
            }
        }
        _ => {
            error!("Unknown button: {}", button);
        }
    }
}

async fn move_mouse(x: f64, z: f64) {
    let sensitivity = 20.0;
    let movement_threshold = 0.7;

    let mouse = Mouse::new();

    let pos = mouse.get_position().unwrap();
    let current_x = pos.x;
    let current_y = pos.y;

    let new_y = current_y - (x * sensitivity) as i32;
    let new_x = current_x - (z * sensitivity) as i32;

    let delta_x = (new_x - current_x).abs();
    let delta_y = (new_y - current_y).abs();

    if delta_x > movement_threshold as i32 || delta_y > movement_threshold as i32 {
        mouse.move_to(new_x, new_y).expect("Unable to move mouse");
    }
}
