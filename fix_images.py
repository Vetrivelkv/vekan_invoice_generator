from PIL import Image
import os

def make_black_transparent(img_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # If the pixel is very dark (close to black), make it transparent
        # Threshold: R<30, G<30, B<30
        if item[0] < 40 and item[1] < 40 and item[2] < 40:
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(img_path, "PNG")
    print(f"Processed {img_path}")

make_black_transparent("extracted_images/image1_2.png")
make_black_transparent("extracted_images/image1_3.png")
