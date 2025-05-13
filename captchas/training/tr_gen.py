import os
import subprocess

CAPTCHA_DIR = "captchas"
TRAINING_FONT_NAME = "customfont"  # You can name it anything
PSM_MODE = "7"

def generate_tr_files():
    images = [f for f in os.listdir(CAPTCHA_DIR) if f.lower().endswith('.png')]

    for image in images:
        base_name = os.path.splitext(image)[0]
        img_path = os.path.join(CAPTCHA_DIR, image)
        box_path = os.path.join(CAPTCHA_DIR, f"{base_name}.box")
        tr_output = os.path.join(CAPTCHA_DIR, f"{TRAINING_FONT_NAME}.{base_name}.tr")

        if not os.path.exists(box_path):
            print(f"Skipping {image} — .box file not found.")
            continue

        print(f"Generating .tr file for {image}...")

        cmd = [
            "tesseract",
            img_path,
            os.path.join(CAPTCHA_DIR, f"{TRAINING_FONT_NAME}.{base_name}"),
            "--psm", PSM_MODE,
            "nobatch",
            "box.train"
        ]

        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error processing {image}: {e}")

if __name__ == "__main__":
    generate_tr_files()
