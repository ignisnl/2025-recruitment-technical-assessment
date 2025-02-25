use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};

pub async fn process_data(Json(request): Json<DataRequest>) -> impl IntoResponse {
    // Calculate sums and return response
    let mut string_len = 0;
    let mut int_sum = 0;
    for entry in request.data {
        match entry {
            Entry::I32(i) => {
                int_sum += i;
            }
            Entry::String(s) => {
                string_len += s.len();
            },
        }
    }

    (StatusCode::OK, Json(DataResponse { string_len, int_sum }))
}

#[derive(Deserialize)]
#[serde(untagged)]
enum Entry {
    I32(i32),
    String(String),
}

#[derive(Deserialize)]
pub struct DataRequest {
    data: Vec<Entry>,
}

#[derive(Serialize)]
pub struct DataResponse {
    string_len: usize,
    int_sum: i32
}
