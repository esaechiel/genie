import os
import re
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
from PIL import Image, ImageTk

# Configuration
CAPTCHA_DIR = "captchas"
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg")
LABEL_FILE = os.path.join(CAPTCHA_DIR, "labels.txt")
WINDOW_TITLE = "CAPTCHA Labeling Tool"

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

class CaptchaLabeler:
    def __init__(self, master):
        self.master = master
        self.master.title(WINDOW_TITLE)
        self.image_files = self.get_image_files()
        self.total_images = len(self.image_files)

        if self.total_images == 0:
            messagebox.showerror("Error", f"No image files found in '{CAPTCHA_DIR}'")
            self.master.quit()
            return

        self.labeled_images = self.load_labeled_images()
        self.current_index = self.get_resume_index()
        self.setup_gui()
        self.load_image()

    def get_image_files(self):
        return sorted([
            f for f in os.listdir(CAPTCHA_DIR)
            if f.lower().endswith(IMAGE_EXTENSIONS)
        ], key=natural_sort_key)

    def load_labeled_images(self):
        labeled = set()
        if os.path.exists(LABEL_FILE):
            with open(LABEL_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    parts = line.strip().split("\t", 1)
                    if len(parts) == 2 and parts[0]:
                        labeled.add(parts[0])
        return labeled

    def get_resume_index(self):
        for idx, filename in enumerate(self.image_files):
            if filename not in self.labeled_images:
                return idx
        return self.total_images

    def setup_gui(self):
        self.image_label = tk.Label(self.master)
        self.image_label.pack(pady=10)

        self.entry = tk.Entry(self.master, font=("Arial", 14))
        self.entry.pack(pady=5)
        self.entry.bind("<Return>", self.save_label)

        self.submit_button = tk.Button(self.master, text="Submit", command=self.save_label)
        self.submit_button.pack(pady=5)

        self.status_label = tk.Label(self.master, text="", font=("Arial", 10))
        self.status_label.pack(pady=5)

        self.progress = ttk.Progressbar(self.master, orient="horizontal", length=300, mode="determinate")
        self.progress.pack(pady=10)

        self.progress_label = tk.Label(self.master, text="", font=("Arial", 10))
        self.progress_label.pack()

        self.update_progress_bar()

    def update_progress_bar(self):
        percentage = (self.current_index / self.total_images) * 100 if self.total_images else 0
        self.progress["value"] = percentage
        self.progress_label.config(text=f"{percentage:.2f}% completed")
        self.master.update_idletasks()

    def load_image(self):
        if self.current_index >= self.total_images:
            messagebox.showinfo("Completed", "All CAPTCHAs have been labeled.")
            self.master.quit()
            return

        image_path = os.path.join(CAPTCHA_DIR, self.image_files[self.current_index])

        try:
            image = Image.open(image_path)
            image = image.resize((200, 80), Image.Resampling.LANCZOS)
            self.photo = ImageTk.PhotoImage(image)
            self.image_label.config(image=self.photo)
            self.image_label.image = self.photo  # Keep reference!
        except Exception as e:
            messagebox.showerror("Image Error", f"Failed to load image '{image_path}': {e}")
            self.current_index += 1
            self.load_image()
            return

        self.entry.delete(0, tk.END)
        self.status_label.config(
            text=f"Image {self.current_index + 1} of {self.total_images} - {self.image_files[self.current_index]}"
        )
        self.update_progress_bar()

    def save_label(self, event=None):
        label = self.entry.get().strip()
        if not label:
            messagebox.showwarning("Input Error", "Please enter the CAPTCHA text.")
            return

        image_filename = self.image_files[self.current_index]

        try:
            with open(LABEL_FILE, "a", encoding="utf-8") as f:
                f.write(f"{image_filename}\t{label}\n")
        except Exception as e:
            messagebox.showerror("File Error", f"Failed to save label: {e}")
            return

        self.current_index += 1
        self.load_image()

def deduplicate_labels_file():
    if not os.path.exists(LABEL_FILE):
        return
    seen = {}
    with open(LABEL_FILE, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("\t", 1)
            if len(parts) == 2 and parts[0]:
                seen[parts[0]] = parts[1]
    with open(LABEL_FILE, "w", encoding="utf-8") as f:
        for fname, label in seen.items():
            f.write(f"{fname}\t{label}\n")

if __name__ == "__main__":
    if not os.path.exists(CAPTCHA_DIR):
        os.makedirs(CAPTCHA_DIR)
        print(f"Created directory '{CAPTCHA_DIR}'. Please add CAPTCHA images and rerun the application.")
    else:
        deduplicate_labels_file()
        root = tk.Tk()
        app = CaptchaLabeler(root)
        root.mainloop()
