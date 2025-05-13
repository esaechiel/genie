import requests
import os
import time

# Define the URL of the CAPTCHA image
url = "http://biz.sitinetworks.com/CaptchaImageHandler.ashx"

# Create a directory to save the images
save_dir = "captchas"
os.makedirs(save_dir, exist_ok=True)

# Number of images to download
num_images = 2000

# Loop to download images
for i in range(1501, num_images + 1):
    try:
        # Send a GET request to fetch the image
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Define the filename and path to save the image
        filename = f"captcha_{i:03d}.png"
        filepath = os.path.join(save_dir, filename)

        # Write the image content to a file
        with open(filepath, "wb") as f:
            f.write(response.content)

        print(f"Downloaded {filename}")

        # Optional: Delay between requests to avoid overwhelming the server
        time.sleep(0.5)

    except requests.RequestException as e:
        print(f"Failed to download image {i}: {e}")
