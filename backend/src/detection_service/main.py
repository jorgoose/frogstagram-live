from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image, ImageOps, ExifTags
import io
import logging
from typing import Dict, Tuple
from pydantic import BaseModel, Field
import time

# Set up logging with a proper format for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FrogConfidences(BaseModel):
    """Confidence scores for different frog types."""
    bullfrog: float = Field(..., ge=0, le=1)
    tailed_frog: float = Field(..., ge=0, le=1)
    tree_frog: float = Field(..., ge=0, le=1)

class ClassificationResponse(BaseModel):
    """Streamlined response containing only essential classification results."""
    is_frog: bool = Field(..., description="Whether the image contains a frog")
    confidence: float = Field(..., ge=0, le=1, description="Overall confidence score")
    details: FrogConfidences = Field(..., description="Individual frog type confidences")

class Config:
    """Application configuration."""
    FROG_CLASSES = frozenset(['bullfrog', 'tailed_frog', 'tree_frog'])
    FROG_THRESHOLD = 0.5
    ALLOWED_MIME_TYPES = frozenset(['image/jpeg', 'image/png', 'image/webp'])
    MODEL_PATH = 'yolo11l-cls.pt'
    
    # Image processing configs
    MAX_UPLOAD_SIZE_MB = 50
    TARGET_SIZE = (1080, 1080)  # Standard processing size
    MIN_DIMENSION = 320
    MAX_DIMENSION = 5000
    JPEG_QUALITY = 90

# Load model at module level for efficient cold starts
try:
    model = YOLO(Config.MODEL_PATH)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise RuntimeError("Model initialization failed")

app = FastAPI()

class ImageProcessor:
    @staticmethod
    def fix_orientation(image: Image.Image) -> Image.Image:
        """Fix image orientation based on EXIF data."""
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            
            exif = image._getexif()
            if exif is not None:
                exif = dict(exif.items())
                orientation_value = exif.get(orientation)
                
                if orientation_value:
                    exif_orientation_map = {
                        3: Image.Transpose.ROTATE_180,
                        6: Image.Transpose.ROTATE_270,
                        8: Image.Transpose.ROTATE_90
                    }
                    if orientation_value in exif_orientation_map:
                        image = image.transpose(exif_orientation_map[orientation_value])
            
            return image
        except (AttributeError, KeyError, IndexError):
            return image

    @staticmethod
    def validate_image(file: UploadFile) -> None:
        """Validate image format and size."""
        if file.content_type not in Config.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported media type. Allowed types: {', '.join(Config.ALLOWED_MIME_TYPES)}"
            )

    @staticmethod
    def process_image(image: Image.Image) -> Image.Image:
        """Process image for model inference."""
        # Fix orientation based on EXIF data
        image = ImageProcessor.fix_orientation(image)
        
        # Validate dimensions
        if min(image.width, image.height) < Config.MIN_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image too small. Minimum dimension: {Config.MIN_DIMENSION}px"
            )
        
        # Scale down if needed
        if max(image.width, image.height) > Config.MAX_DIMENSION:
            image.thumbnail((Config.MAX_DIMENSION, Config.MAX_DIMENSION))
        
        # Process for model
        processed_image = ImageOps.contain(image, Config.TARGET_SIZE)
        
        # Ensure RGB mode
        if processed_image.mode != 'RGB':
            processed_image = processed_image.convert('RGB')

        return processed_image

    @staticmethod
    def read_image_file(file: UploadFile) -> Image.Image:
        """Read and validate image file."""
        try:
            # Check file size
            file.file.seek(0, 2)
            size_in_mb = file.file.tell() / (1024 * 1024)
            file.file.seek(0)
            
            if size_in_mb > Config.MAX_UPLOAD_SIZE_MB:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File size exceeds {Config.MAX_UPLOAD_SIZE_MB}MB limit"
                )

            image_data = file.file.read()
            return Image.open(io.BytesIO(image_data))

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reading image: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file"
            )

class FrogClassifier:
    @staticmethod
    def get_frog_confidences(results) -> Dict[str, float]:
        """Extract confidence scores for frog-related classes."""
        try:
            probs = results[0].probs
            names = results[0].names
            
            frog_scores = {class_name: 0.0 for class_name in Config.FROG_CLASSES}
            
            for class_name in Config.FROG_CLASSES:
                for i, name in names.items():
                    if name.lower() == class_name.lower():
                        frog_scores[class_name] = float(probs.data[i])
                        break
            
            return frog_scores
        except Exception as e:
            logger.error(f"Error processing prediction results: {str(e)}")
            raise ValueError(f"Error processing prediction results: {str(e)}")

    @staticmethod
    def analyze_frog_confidence(frog_scores: Dict[str, float]) -> Tuple[bool, float]:
        """Calculate total frog confidence and determine if image is of a frog."""
        total_confidence = sum(frog_scores.values())
        is_frog = total_confidence >= Config.FROG_THRESHOLD
        return is_frog, total_confidence

@app.post(
    "/classify-frog",
    response_model=ClassificationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        413: {"description": "File too large"},
        415: {"description": "Unsupported media type"},
        400: {"description": "Bad request"},
        500: {"description": "Internal server error"}
    }
)
def classify_frog(file: UploadFile = File(...)) -> ClassificationResponse:
    """Classify whether an image contains a frog and return confidence scores."""
    start_time = time.time()
    
    try:
        # Process image
        ImageProcessor.validate_image(file)
        original_image = ImageProcessor.read_image_file(file)
        processed_image = ImageProcessor.process_image(original_image)

        # Get prediction
        results = model(processed_image)
        
        # Process results
        frog_scores = FrogClassifier.get_frog_confidences(results)
        is_frog, total_confidence = FrogClassifier.analyze_frog_confidence(frog_scores)
        
        # Log processing time
        processing_time = time.time() - start_time
        logger.info(
            f"Prediction completed in {processing_time:.2f}s - "
            f"is_frog={is_frog}, confidence={total_confidence:.4f}"
        )
        
        return ClassificationResponse(
            is_frog=is_frog,
            confidence=round(total_confidence, 4),
            details=FrogConfidences(**{
                k: round(v, 4) for k, v in frog_scores.items()
            })
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during image processing"
        )

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }