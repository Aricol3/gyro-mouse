use futures::{StreamExt};
use std::time::Duration;
use mouse_rs::{Mouse};
use tokio::time::Instant;
use tokio::time;
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

#[tokio::main]
async fn test() {
    env_logger::init();

    let test_data = read_coordinates_from_file("./src/test.txt").expect("Failed to read data from file");
    println!("{:?}", test_data);

    run_test(test_data).await;
}

fn read_coordinates_from_file(filename: &str) -> Result<Vec<(f64, f64)>, io::Error> {
    let mut data = Vec::new();

    if let Ok(lines) = read_lines(filename) {
        for line in lines {
            if let Ok(l) = line {
                let parts: Vec<&str> = l.trim().split(':').collect();
                if parts.len() == 2 {
                    if let (Ok(x), Ok(z)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
                        data.push((x, z));
                    }
                }
            }
        }
    }

    Ok(data)
}

fn read_lines<P>(filename: P) -> Result<io::Lines<io::BufReader<File>>, io::Error>
where
    P: AsRef<Path>,
{
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}

async fn run_test(data: Vec<(f64, f64)>) {
    let mut interval = time::interval(Duration::from_millis(10));
    let mut stopwatch_started = false;
    let mut start_time: Option<Instant> = None;
    let mut counter = 0;

    for (x, z) in data {
        interval.tick().await;

        println!("Mouse coordinates {x}:{z}");
        counter += 1;
        println!("Counter: {counter}");

        if !stopwatch_started {
            stopwatch_started = true;
            start_time = Some(Instant::now());
        }

        if let Some(start) = start_time {
            let elapsed = start.elapsed();
            println!("Elapsed time: {:.2?}", elapsed);
        }

        move_mouse(x, z);
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
