import pytesseract
import os
from PIL import Image

# Point to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Set TESSDATA_PREFIX to the tessdata directory containing customfont.traineddata
os.environ["TESSDATA_PREFIX"] = r"C:\Users\Sahil\my-puppeteer-project\captchas\training"

# Image path
image_path = r'C:\Users\Sahil\my-puppeteer-project\captchas\captcha_501.png'

# Run OCR
text = pytesseract.image_to_string(Image.open(image_path), lang='customfont', config='--psm 7')

print("Predicted:", text.strip())
