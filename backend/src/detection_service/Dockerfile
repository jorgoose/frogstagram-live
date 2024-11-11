FROM public.ecr.aws/lambda/python:3.10

# Install system dependencies required for OpenCV/YOLO
RUN yum update -y && \
    yum install -y \
        mesa-libGL \
        opencv-python-headless \
    && yum clean all

# Copy requirements and install dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

# Copy function code and model
COPY src/detection_service/lambda_function.py ${LAMBDA_TASK_ROOT}
COPY yolo11l-cls.pt ${LAMBDA_TASK_ROOT}

# Debug: List contents to verify
RUN ls -la ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD ["lambda_function.lambda_handler"]