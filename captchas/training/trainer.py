import os
import subprocess

# Set up paths
CAPTCHA_DIR = "captchas"
LANG_NAME = "customfont"
TRAINEDDATA_OUTPUT = os.path.join(CAPTCHA_DIR, f"{LANG_NAME}.traineddata")

# Paths to generated files
box_files = [os.path.join(CAPTCHA_DIR, f) for f in os.listdir(CAPTCHA_DIR) if f.endswith(".box")]
tr_files = [os.path.join(CAPTCHA_DIR, f) for f in os.listdir(CAPTCHA_DIR) if f.endswith(".tr")]

# Step 1: Generate unicharset
def generate_unicharset():
    print("[*] Generating unicharset...")
    cmd = ["unicharset_extractor"] + box_files
    subprocess.run(cmd, check=True)

# Step 2: Create font_properties
def create_font_properties():
    print("[*] Creating font_properties...")
    font_properties_path = os.path.join(CAPTCHA_DIR, "font_properties")
    with open(font_properties_path, "w") as f:
        f.write(f"{LANG_NAME} 0 0 0 0 0\n")
    return font_properties_path

# Step 3: Run shapeclustering, mftraining, cntraining
def run_training_tools(font_properties_path):
    print("[*] Running shapeclustering...")
    subprocess.run([
        "shapeclustering", "-F", font_properties_path, "-U",
        os.path.join(CAPTCHA_DIR, "unicharset")
    ] + tr_files, check=True)

    print("[*] Running mftraining...")
    subprocess.run([
        "mftraining", "-F", font_properties_path, "-U",
        os.path.join(CAPTCHA_DIR, "unicharset"),
        "-O", os.path.join(CAPTCHA_DIR, f"{LANG_NAME}.traineddata")
    ] + tr_files, check=True)

    print("[*] Running cntraining...")
    subprocess.run(["cntraining"] + tr_files, check=True)

# Step 4: Rename output files
def rename_output_files():
    print("[*] Renaming output files...")
    mapping = {
        "inttemp": f"{LANG_NAME}.inttemp",
        "normproto": f"{LANG_NAME}.normproto",
        "pffmtable": f"{LANG_NAME}.pffmtable",
        "shapetable": f"{LANG_NAME}.shapetable"
    }
    for src, dst in mapping.items():
        os.rename(src, os.path.join(CAPTCHA_DIR, dst))

# Step 5: Combine into traineddata
def combine_traineddata():
    print("[*] Combining files into traineddata...")
    subprocess.run([
        "combine_tessdata",
        os.path.join(CAPTCHA_DIR, f"{LANG_NAME}.")
    ], check=True)

# Execute all steps
generate_unicharset()
font_props_path = create_font_properties()
run_training_tools(font_props_path)
rename_output_files()
combine_traineddata()

print(f"[✓] Training completed. Trained data saved as {TRAINEDDATA_OUTPUT}")
