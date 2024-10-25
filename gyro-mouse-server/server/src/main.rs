use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::protocol::Message};
use futures::{StreamExt, SinkExt};
use std::env;
use std::net::SocketAddr;
use log::{info, error};
use mouse_rs::{types::keys::Keys, Mouse};

#[tokio::main]
async fn main() {
    env_logger::init();

    let addr = env::args().nth(1).unwrap_or_else(|| "192.168.100.56:3000".to_string());
    let addr: SocketAddr = addr.parse().expect("Invalid address");

    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");

    info!("Listening on: {}", addr);
    println!("Listening on: {}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(handle_connection(stream));
    }
}

async fn handle_connection(stream: TcpStream) {
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            error!("Error during the websocket handshake: {}", e);
            return;
        }
    };

    let (mut sender, mut receiver) = ws_stream.split();

    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if text.starts_with("{\"event\":\"gyroData\"") {
                    let gyro_data: serde_json::Value = serde_json::from_str(&text).unwrap();
                    let x = gyro_data["data"]["x"].as_f64().unwrap_or(0.0);
                    let y = gyro_data["data"]["y"].as_f64().unwrap_or(0.0);
                    let z = gyro_data["data"]["z"].as_f64().unwrap_or(0.0);

                    move_mouse(x, z);
                } else {
                    println!("Received other message: {:?}", text);
                }
            }
            Ok(Message::Close(_)) => break,
            Ok(_) => (),
            Err(e) => {
                error!("Error processing message: {}", e);
                break;
            }
        }
    }
}

fn move_mouse(x: f64, z: f64) {
    let sensitivity = 20.0;
    let movement_threshold = 1.0;

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

