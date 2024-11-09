from setuptools import setup, find_packages

setup(
    name="detection_service",
    packages=find_packages(where="src"),
    package_dir={"": "src"}
)