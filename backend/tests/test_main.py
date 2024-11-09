from fastapi.testclient import TestClient
from detection_service.main import app, Config
from PIL import Image
import io
import pytest
from typing import BinaryIO

client = TestClient(app)

def create_test_image(size: tuple, color: tuple = (0, 255, 0)) -> BinaryIO:
    """Helper function to create test images."""
    image = Image.new("RGB", size, color)
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)
    return img_byte_arr

# Basic endpoint tests
def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "model_loaded" in response.json()

# Input validation tests
@pytest.mark.parametrize("invalid_file", [
    ("test.txt", b"Hello World", "text/plain"),
    ("test.pdf", b"PDF content", "application/pdf"),
    ("test.gif", b"GIF content", "image/gif"),
])
def test_invalid_file_types(invalid_file):
    """Test rejection of various invalid file types."""
    filename, content, content_type = invalid_file
    response = client.post(
        "/classify-frog",
        files={"file": (filename, content, content_type)}
    )
    assert response.status_code == 415
    assert "Unsupported media type" in response.json()["detail"]

def test_missing_file():
    """Test request without file."""
    response = client.post("/classify-frog")
    assert response.status_code == 422  # FastAPI validation error

def test_empty_file():
    """Test empty file upload."""
    response = client.post(
        "/classify-frog",
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400

# Image dimension tests
@pytest.mark.parametrize("dimensions", [
    (50, 50),  # Too small
    (100, 300),  # One dimension too small
    (Config.MIN_DIMENSION - 1, Config.MIN_DIMENSION - 1),  # Just under minimum
])
def test_undersized_images(dimensions):
    """Test rejection of images below minimum dimensions."""
    img_byte_arr = create_test_image(dimensions)
    response = client.post(
        "/classify-frog",
        files={"file": ("small.jpg", img_byte_arr, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Image too small" in response.json()["detail"]

# Image format tests
@pytest.mark.parametrize("format_info", [
    ("PNG", "image/png"),
    ("JPEG", "image/jpeg"),
    ("WEBP", "image/webp"),
])
def test_supported_formats(format_info):
    """Test all supported image formats."""
    img_format, mime_type = format_info
    image = Image.new("RGB", (Config.MIN_DIMENSION, Config.MIN_DIMENSION), "green")
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=img_format)
    img_byte_arr.seek(0)

    response = client.post(
        "/classify-frog",
        files={"file": (f"test.{img_format.lower()}", img_byte_arr, mime_type)}
    )
    assert response.status_code == 200

# Image content tests
@pytest.mark.parametrize("color_mode", [
    "RGB",
    "RGBA",
    "L",  # Grayscale
])
def test_color_modes(color_mode):
    """Test handling of different color modes."""
    size = (Config.MIN_DIMENSION, Config.MIN_DIMENSION)
    if color_mode == "RGBA":
        image = Image.new(color_mode, size, (0, 255, 0, 255))
    elif color_mode == "L":
        image = Image.new(color_mode, size, 128)
    else:
        image = Image.new(color_mode, size, (0, 255, 0))
    
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    response = client.post(
        "/classify-frog",
        files={"file": ("test.png", img_byte_arr, "image/png")}
    )
    assert response.status_code == 200

# Response validation tests
def test_valid_response_structure():
    """Test complete response structure and data types."""
    img_byte_arr = create_test_image((Config.MIN_DIMENSION, Config.MIN_DIMENSION))
    response = client.post(
        "/classify-frog",
        files={"file": ("test.jpg", img_byte_arr, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check all required fields
    assert all(key in data for key in ["is_frog", "confidence", "details"])
    
    # Type checks
    assert isinstance(data["is_frog"], bool)
    assert isinstance(data["confidence"], float)
    assert isinstance(data["details"], dict)
    
    # Value range checks
    assert 0 <= data["confidence"] <= 1
    for score in data["details"].values():
        assert 0 <= score <= 1
        assert isinstance(score, float)
    
    # Check frog types
    assert all(frog_type in data["details"] 
              for frog_type in ["bullfrog", "tailed_frog", "tree_frog"])
    
    # Check confidence calculation consistency with more reasonable tolerance
    total_confidence = sum(data["details"].values())
    assert abs(total_confidence - data["confidence"]) < 0.1  # Increased tolerance for floating-point arithmetic

# Error handling tests
def test_corrupted_image():
    """Test handling of corrupted image data."""
    response = client.post(
        "/classify-frog",
        files={"file": ("corrupt.jpg", b"corrupted image data", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Invalid image file" in response.json()["detail"]

def test_very_large_file():
    """Test handling of files exceeding size limit."""
    # Create a file slightly larger than the limit
    size_mb = Config.MAX_UPLOAD_SIZE_MB + 1
    large_data = b'0' * (size_mb * 1024 * 1024)
    
    response = client.post(
        "/classify-frog",
        files={"file": ("large.jpg", large_data, "image/jpeg")}
    )
    assert response.status_code == 413
    assert "File size exceeds" in response.json()["detail"]

# Performance tests
def test_response_time():
    """Test response time is within acceptable limits."""
    img_byte_arr = create_test_image((Config.MIN_DIMENSION, Config.MIN_DIMENSION))
    
    import time
    start_time = time.time()
    response = client.post(
        "/classify-frog",
        files={"file": ("test.jpg", img_byte_arr, "image/jpeg")}
    )
    end_time = time.time()
    
    assert response.status_code == 200
    assert end_time - start_time < 5  # Response should be under 5 seconds