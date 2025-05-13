import os
import subprocess

CAPTCHA_DIR = "captchas"
PSM_MODE = "7"

def generate_box_files():
    if not os.path.exists(CAPTCHA_DIR):
        print(f"Directory '{CAPTCHA_DIR}' not found.")
        return

    images = [f for f in os.listdir(CAPTCHA_DIR) if f.lower().endswith('.png')]

    for image in images:
        base_name = os.path.splitext(image)[0]
        image_path = os.path.join(CAPTCHA_DIR, image)
        output_path = os.path.join(CAPTCHA_DIR, base_name)

        print(f"Generating .box file for {image}...")

        cmd = [
            "tesseract",
            image_path,
            output_path,
            "--psm", PSM_MODE,
            "makebox"
        ]

        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error processing {image}: {e}")

if __name__ == "__main__":
    generate_box_files()
