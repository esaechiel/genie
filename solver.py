from PIL import Image
import pytesseract
import cv2
import numpy as np

# Load image
image_path = r"C:\Users\Sahil\my-puppeteer-project/captcha_screenshot.png"
image = cv2.imread(image_path)

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Denoising
gray = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)

# Adaptive Thresholding
thresh = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY_INV, 11, 2
)

# Apply thresholding to clean background noise
#_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Optionally invert image (black text on white background)
#inverted = cv2.bitwise_not(thresh)

# OCR using pytesseract
custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
captcha_text = pytesseract.image_to_string(thresh, config=custom_config)

# Strip any extra whitespace or newlines from the result
captcha_text = captcha_text.strip()

# Check if the captcha text meets the conditions
if len(captcha_text) != 5 or 'l' in captcha_text or 'I' in captcha_text or 'i' in captcha_text or 'j' in captcha_text or 'O' in captcha_text:
    print(-1)  # Print -1 if conditions are not met
else:
    print(captcha_text)  # Print the captcha text if it meets the conditions