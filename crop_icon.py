from PIL import Image, ImageDraw
import os

def mask_into_circle(img_path):
    if not os.path.exists(img_path):
        print("icon.png not found")
        return
        
    try:
        img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print("Error opening image:", e)
        return
    
    # 1. Zoom in a bit by cropping a central square
    width, height = img.size
    min_dim = min(width, height)
    
    # Zoom in by 5%
    zoom_factor = 0.05
    crop_size = min_dim * (1 - zoom_factor)
    
    left = (width - crop_size) / 2
    top = (height - crop_size) / 2
    right = (width + crop_size) / 2
    bottom = (height + crop_size) / 2
    
    img = img.crop((left, top, right, bottom))
    
    # 2. Resize to 512x512
    img = img.resize((512, 512), Image.LANCZOS)
    
    # 3. Apply circular mask
    mask = Image.new('L', (512, 512), 0)
    draw = ImageDraw.Draw(mask)
    # The circle fills the whole bounds
    draw.ellipse((0, 0, 512, 512), fill=255)
    
    result = Image.new('RGBA', (512, 512), (0,0,0,0))
    result.paste(img, (0, 0), mask)
    
    # Save back
    result.save(img_path, format="PNG")
    print("Successfully cropped and masked icon.png!")

if __name__ == "__main__":
    mask_into_circle("icon.png")
