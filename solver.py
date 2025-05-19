import argparse
from PIL import Image
import pytesseract
import cv2
import numpy as np
import os

# Argument parser
parser = argparse.ArgumentParser(description='Solve CAPTCHA from an image file.')
parser.add_argument('image_path', type=str, help='Path to the CAPTCHA image')

args = parser.parse_args()
image_path = args.image_path

if not os.path.exists(image_path):
    print("❌ File does not exist.")
    exit(1)

# Load image
#image_path = r"C:\Users\Sahil\my-puppeteer-project/captcha_screenshot.png"
image = cv2.imread(image_path)
#cv2.imshow("Original", image)

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#cv2.imshow("Grayscale", gray)

# Denoising
gray = cv2.fastNlMeansDenoising(gray, None, 120, 7, 21)
#cv2.imshow("Denoised", gray)

# Adaptive Thresholding
thresh = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY_INV, 21, 6
)
#cv2.imshow("Adaptive Threshold", thresh)

# Apply thresholding to clean background noise
#_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Optionally invert image (black text on white background)
inverted = cv2.bitwise_not(thresh)

# OCR using pytesseract
custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
captcha_text = pytesseract.image_to_string(image, config=custom_config)

# Strip any extra whitespace or newlines from the result
captcha_text = captcha_text.strip()

# Check if the captcha text meets the conditions
if len(captcha_text) != 5 or 'l' in captcha_text or 'I' in captcha_text or 'i' in captcha_text or 'j' in captcha_text or 'O' in captcha_text:
    print(-1)  # Print -1 if conditions are not met
else:
    print(captcha_text)  # Print the captcha text if it meets the conditions

#cv2.waitKey(0)