import cv2
import pytesseract
import os
import pandas as pd
import numpy as np

def extract_characters_and_ocr(image_path):
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)

    # Thresholding
    thresh = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
    cv2.THRESH_BINARY_INV, 15, 8)

    # Optional: Dilation to better separate characters
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    thresh = cv2.dilate(thresh, kernel, iterations=1)

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter and sort contours
    character_regions = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if 10 < w < 60 and 20 < h < 80:
            character_regions.append((x, y, w, h))

    # Keep top 5 regions by size, then sort left-to-right
    character_regions = sorted(character_regions, key=lambda b: b[2] * b[3], reverse=True)[:5]
    character_regions = sorted(character_regions, key=lambda b: b[0])

    extracted_text = ''
    for idx, (x, y, w, h) in enumerate(character_regions):
        char_img = thresh[y:y+h, x:x+w]
        char_img = cv2.resize(char_img, (32, 32))
        char_img = cv2.copyMakeBorder(char_img, 5, 5, 5, 5, cv2.BORDER_CONSTANT, value=0)

        custom_config = r'--oem 3 --psm 10 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        char = pytesseract.image_to_string(char_img, config=custom_config)
        extracted_text += char.strip()
    debug_image = image.copy()
    
    for (x, y, w, h) in character_regions:
        cv2.rectangle(debug_image, (x, y), (x + w, y + h), (0, 255, 0), 2)

    cv2.imshow("Segmented Characters", debug_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    return extracted_text

# === Configuration ===
captcha_folder = r'C:\Users\Sahil\my-puppeteer-project\captchas\training\captchas'
ground_truth_file = r'C:\Users\Sahil\my-puppeteer-project\captchas\labels.txt'
custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

# === Load ground truth into a dictionary ===
ground_truth = {}
with open(ground_truth_file, 'r') as f:
    for line in f:
        if '\t' in line:
            filename, label = line.strip().split('\t')
            ground_truth[filename] = label.strip()

# === Initialize result tracking ===
results = []

# === Process each image ===
for filename in sorted(os.listdir(captcha_folder)):
    if filename.endswith('.png') and filename in ground_truth:
        img_path = os.path.join(captcha_folder, filename)
        image = cv2.imread(img_path)

        # Preprocess image (same as before)
#        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#        gray = cv2.fastNlMeansDenoising(gray, None, 120, 7, 21)
#        thresh = cv2.adaptiveThreshold(
#            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
#            cv2.THRESH_BINARY_INV, 21, 6
#        )

        # OCR
        text = extract_characters_and_ocr(img_path)
        text = text.strip()

        # Compare to ground truth
        expected = ground_truth[filename]
        is_correct = (text == expected)
        results.append({
            'filename': filename,
            'expected': expected,
            'predicted': text,
            'correct': is_correct
        })

# === Generate report ===
df = pd.DataFrame(results)
total = len(df)
correct = df['correct'].sum()
incorrect = total - correct

print(f"\nTotal Images: {total}")
print(f"Correct: {correct}")
print(f"Incorrect: {incorrect}")
print(f"Accuracy: {correct / total * 100:.2f}%")

# Optional: Show detailed results
show_details = True
if show_details:
    print("\nCorrect Predictions:")
    print(df[df['correct'] == True][['filename', 'expected', 'predicted']])

    print("\nIncorrect Predictions:")
    print(df[df['correct'] == False][['filename', 'expected', 'predicted']])

# Optionally, save results to CSV
df.to_csv('captcha_results.csv', index=False)
