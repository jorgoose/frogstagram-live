import json
import boto3
from ultralytics import YOLO
from PIL import Image, ImageOps, ExifTags
import logging
import time
import os
from io import BytesIO
from typing import Dict

# Initialize S3 client
s3 = boto3.client("s3")

# Set environment variables early
os.environ["YOLO_CONFIG_DIR"] = "/tmp"
os.environ["MPLCONFIGDIR"] = "/tmp"
os.environ["YOLO_VERBOSE"] = "False"
os.environ["DISABLE_ULTRALYTICS_ANALYTICS"] = "True"

# Enhanced logging setup
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class Config:
    """Application configuration."""

    FROG_CLASSES = frozenset(["bullfrog", "tailed_frog", "tree_frog"])
    FROG_THRESHOLD = 0.5
    MODEL_PATH = "yolo11l-cls.pt"


# Load model at module level for efficient cold starts
try:
    model = YOLO(Config.MODEL_PATH)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise RuntimeError("Model initialization failed")


class ImageProcessor:
    @staticmethod
    def fix_orientation(image: Image.Image) -> Image.Image:
        """Fix image orientation based on EXIF data."""
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == "Orientation":
                    break

            exif = image._getexif()
            if exif is not None:
                orientation_value = exif.get(orientation)
                exif_orientation_map = {
                    3: Image.Transpose.ROTATE_180,
                    6: Image.Transpose.ROTATE_270,
                    8: Image.Transpose.ROTATE_90,
                }
                if orientation_value in exif_orientation_map:
                    image = image.transpose(exif_orientation_map[orientation_value])
        except (AttributeError, KeyError, IndexError):
            pass
        return image

    @staticmethod
    def process_image(image: Image.Image) -> Image.Image:
        """Ensure image is processed for model inference, including orientation fix and RGB mode."""
        image = ImageProcessor.fix_orientation(image)
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image


class FrogClassifier:
    @staticmethod
    def get_frog_confidences(results) -> Dict[str, float]:
        """Extract confidence scores for frog-related classes."""
        try:
            frog_scores = {class_name: 0.0 for class_name in Config.FROG_CLASSES}
            probs = results[0].probs
            names = results[0].names

            for class_name in Config.FROG_CLASSES:
                for i, name in names.items():
                    if isinstance(name, str) and name.lower() == class_name.lower():
                        frog_scores[class_name] = float(probs.data[i])
                        break
            return frog_scores
        except Exception as e:
            logger.error(f"Error processing prediction results: {str(e)}")
            raise ValueError(f"Error processing prediction results: {str(e)}")

    @staticmethod
    def analyze_frog_confidence(frog_scores: Dict[str, float]) -> Dict[str, float]:
        """Calculate total frog confidence and determine if image is of a frog."""
        total_confidence = sum(frog_scores.values())
        is_frog = total_confidence >= Config.FROG_THRESHOLD
        return {
            "is_frog": is_frog,
            "confidence": round(total_confidence, 4),
            "details": {k: round(v, 4) for k, v in frog_scores.items()},
        }


def lambda_handler(event, context):
    request_start = time.time()
    logger.info("=== New request starting ===")
    logger.info(f"Request ID: {context.aws_request_id}")

    # Extract S3 details from the event
    body = json.loads(event["body"])
    bucket = body.get("bucket")
    key = body.get("key")

    if not bucket or not key:
        logger.error("Bucket or key not provided")
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Bucket and key are required"}),
        }

    logger.info(f"Processing image from s3://{bucket}/{key}")

    # Retrieve and process image from S3
    try:
        s3_response = s3.get_object(Bucket=bucket, Key=key)
        image_data = s3_response["Body"].read()
        image = Image.open(BytesIO(image_data))
        image = ImageProcessor.process_image(image)
    except Exception as e:
        logger.error(f"Failed to load and process image from S3: {str(e)}")
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Failed to load image from S3"}),
        }

    # Run prediction
    try:
        inference_start = time.time()
        results = model(image)
        inference_time = time.time() - inference_start
        logger.info(f"Inference completed in {inference_time:.2f} seconds")
    except Exception as e:
        logger.error(f"Error during model inference: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Model inference error"}),
        }

    # Process and analyze results
    try:
        frog_scores = FrogClassifier.get_frog_confidences(results)
        response_data = FrogClassifier.analyze_frog_confidence(frog_scores)
    except Exception as e:
        logger.error(f"Error processing model results: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Error processing model results"}),
        }

    # Return the classification response
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(response_data),
    }
