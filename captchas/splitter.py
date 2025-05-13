with open('labels.txt', 'r') as f:
    lines = f.readlines()

# Process each line
for line in lines:
    if line.strip():  # skip empty lines
        filename, value = line.strip().split('\t')
        txt_filename = filename.replace('.png', '.txt')
        with open(txt_filename, 'w') as out_file:
            out_file.write(value)