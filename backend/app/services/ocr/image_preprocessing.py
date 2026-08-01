import numpy as np

def preprocess_image(img: np.ndarray) -> np.ndarray:
    """
    Applies a preprocessing pipeline to improve OCR accuracy.
    cv2 is imported lazily here to avoid module-load failures.
    """
    import cv2
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    binary = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    return binary
