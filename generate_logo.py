import math
from PIL import Image, ImageDraw, ImageFont

# 512x512 High-Res App Icon
SIZE = 512
img = Image.new("RGBA", (SIZE, SIZE), (11, 15, 25, 255)) # Dark navy Cyber-Night theme
draw = ImageDraw.Draw(img)

# 1. Background Gradient / Glow Circle
center_x, center_y = 256, 230
for r in range(230, 0, -2):
    alpha = int(255 * (1 - (r / 230) * 0.4))
    # Radial color from deep royal purple/blue to vibrant cyan
    col = (
        int(14 + (99 - 14) * (1 - r / 230)),
        int(24 + (102 - 24) * (1 - r / 230)),
        int(45 + (241 - 45) * (1 - r / 230)),
        255
    )
    draw.ellipse([center_x - r, center_y - r, center_x + r, center_y + r], fill=col)

# 2. Golden Circular Vault Outer Ring
draw.ellipse([center_x - 175, center_y - 175, center_x + 175, center_y + 175], outline=(245, 158, 11, 255), width=8)
draw.ellipse([center_x - 165, center_y - 165, center_x + 165, center_y + 165], outline=(251, 191, 36, 255), width=4)

# Vault gear bolts around the ring
for angle_deg in range(0, 360, 30):
    rad = math.radians(angle_deg)
    bx = center_x + int(170 * math.cos(rad))
    by = center_y + int(170 * math.sin(rad))
    draw.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255), width=2)

# 3. Magic Lamp & Genie Smoke on the Left/Center
# Magical Cyan/Gold Smoke swirls
smoke_points = [
    (140, 290), (160, 250), (190, 210), (220, 190), (270, 160), (320, 130)
]
for sx, sy in smoke_points:
    draw.ellipse([sx - 22, sy - 22, sx + 22, sy + 22], fill=(14, 165, 233, 160))
    draw.ellipse([sx - 14, sy - 14, sx + 14, sy + 14], fill=(56, 189, 248, 200))
    draw.ellipse([sx - 6, sy - 6, sx + 6, sy + 6], fill=(224, 242, 254, 255))

# 4. Cartoon Aladdin / Alavuddin Character (Center)
# Aladdin's Head (Cute round cartoon face)
head_x, head_y = 256, 175
# Neck
draw.rectangle([head_x - 18, head_y + 40, head_x + 18, head_y + 75], fill=(245, 195, 150, 255))
# Face
draw.ellipse([head_x - 52, head_y - 45, head_x + 52, head_y + 55], fill=(254, 215, 170, 255), outline=(217, 119, 6, 255), width=3)

# Aladdin's Hair (Black cartoon wavy hair)
draw.chord([head_x - 56, head_y - 60, head_x + 56, head_y + 10], 180, 360, fill=(30, 27, 75, 255))
draw.ellipse([head_x - 56, head_y - 30, head_x - 30, head_y + 15], fill=(30, 27, 75, 255))
draw.ellipse([head_x + 30, head_y - 30, head_x + 56, head_y + 15], fill=(30, 27, 75, 255))

# Aladdin's Purple/Red Fez Hat with Gold Tassel
draw.polygon([(head_x - 26, head_y - 50), (head_x + 26, head_y - 50), (head_x + 20, head_y - 95), (head_x - 20, head_y - 95)], fill=(225, 29, 72, 255), outline=(159, 18, 57, 255))
# Hat Gold Trim
draw.line([(head_x - 27, head_y - 50), (head_x + 27, head_y - 50)], fill=(245, 158, 11, 255), width=5)
# Golden Tassel
draw.line([(head_x + 16, head_y - 95), (head_x + 36, head_y - 65)], fill=(245, 158, 11, 255), width=3)
draw.ellipse([head_x + 34, head_y - 67, head_x + 42, head_y - 59], fill=(245, 158, 11, 255))

# Aladdin's Eyes (Big cartoon friendly eyes with sparkle)
# Left Eye
draw.ellipse([head_x - 32, head_y - 12, head_x - 8, head_y + 16], fill=(255, 255, 255, 255), outline=(30, 27, 75, 255), width=2)
draw.ellipse([head_x - 24, head_y - 6, head_x - 12, head_y + 12], fill=(15, 23, 42, 255))
draw.ellipse([head_x - 22, head_y - 4, head_x - 16, head_y + 2], fill=(255, 255, 255, 255)) # sparkle
# Right Eye
draw.ellipse([head_x + 8, head_y - 12, head_x + 32, head_y + 16], fill=(255, 255, 255, 255), outline=(30, 27, 75, 255), width=2)
draw.ellipse([head_x + 12, head_y - 6, head_x + 24, head_y + 12], fill=(15, 23, 42, 255))
draw.ellipse([head_x + 14, head_y - 4, head_x + 20, head_y + 2], fill=(255, 255, 255, 255)) # sparkle

# Eyebrows
draw.arc([head_x - 36, head_y - 28, head_x - 8, head_y - 12], 200, 340, fill=(30, 27, 75, 255), width=3)
draw.arc([head_x + 8, head_y - 28, head_x + 36, head_y - 12], 200, 340, fill=(30, 27, 75, 255), width=3)

# Cheerful Smile
draw.arc([head_x - 20, head_y + 10, head_x + 20, head_y + 36], 10, 170, fill=(190, 24, 93, 255), width=4)
# Cheeks blush
draw.ellipse([head_x - 42, head_y + 14, head_x - 24, head_y + 26], fill=(251, 146, 60, 120))
draw.ellipse([head_x + 24, head_y + 14, head_x + 42, head_y + 26], fill=(251, 146, 60, 120))

# Aladdin's Purple Vest & White Shirt
# Shirt
draw.polygon([(head_x - 55, head_y + 65), (head_x + 55, head_y + 65), (head_x + 75, head_y + 145), (head_x - 75, head_y + 145)], fill=(248, 250, 252, 255))
# Vest Left
draw.polygon([(head_x - 65, head_y + 65), (head_x - 18, head_y + 65), (head_x - 22, head_y + 145), (head_x - 75, head_y + 145)], fill=(124, 58, 237, 255), outline=(91, 33, 182, 255), width=2)
# Vest Right
draw.polygon([(head_x + 18, head_y + 65), (head_x + 65, head_y + 65), (head_x + 75, head_y + 145), (head_x + 22, head_y + 145)], fill=(124, 58, 237, 255), outline=(91, 33, 182, 255), width=2)
# Golden Vest Trim
draw.line([(head_x - 18, head_y + 65), (head_x - 22, head_y + 145)], fill=(245, 158, 11, 255), width=3)
draw.line([(head_x + 18, head_y + 65), (head_x + 22, head_y + 145)], fill=(245, 158, 11, 255), width=3)

# 5. Golden Magic Lamp in Aladdin's Hands (Bottom Center)
lamp_x, lamp_y = 256, 310
# Lamp Base
draw.ellipse([lamp_x - 30, lamp_y + 22, lamp_x + 30, lamp_y + 36], fill=(217, 119, 6, 255), outline=(180, 83, 9, 255), width=2)
# Lamp Body (Teardrop shape)
draw.ellipse([lamp_x - 55, lamp_y - 12, lamp_x + 55, lamp_y + 26], fill=(245, 158, 11, 255), outline=(217, 119, 6, 255), width=3)
# Lamp Highlights
draw.ellipse([lamp_x - 40, lamp_y - 6, lamp_x + 20, lamp_y + 14], fill=(253, 230, 138, 220))
# Lamp Spout (Left)
draw.polygon([(lamp_x - 45, lamp_y + 4), (lamp_x - 90, lamp_y - 25), (lamp_x - 85, lamp_y - 35), (lamp_x - 35, lamp_y - 6)], fill=(245, 158, 11, 255), outline=(217, 119, 6, 255), width=2)
# Spout Opening
draw.ellipse([lamp_x - 95, lamp_y - 38, lamp_x - 75, lamp_y - 24], fill=(251, 191, 36, 255), outline=(217, 119, 6, 255), width=2)
# Lamp Handle (Right)
draw.arc([lamp_x + 30, lamp_y - 26, lamp_x + 85, lamp_y + 20], 280, 100, fill=(245, 158, 11, 255), width=8)
# Lamp Lid Knob
draw.ellipse([lamp_x - 12, lamp_y - 24, lamp_x + 12, lamp_y - 10], fill=(245, 158, 11, 255), outline=(217, 119, 6, 255), width=2)
draw.ellipse([lamp_x - 6, lamp_y - 30, lamp_x + 6, lamp_y - 22], fill=(251, 191, 36, 255))

# 6. Glowing Keyhole / Vault Lock on the Magic Lamp
draw.ellipse([lamp_x - 12, lamp_y - 2, lamp_x + 12, lamp_y + 14], fill=(15, 23, 42, 255), outline=(254, 240, 138, 255), width=2)
draw.polygon([(lamp_x - 5, lamp_y + 6), (lamp_x + 5, lamp_y + 6), (lamp_x + 8, lamp_y + 18), (lamp_x - 8, lamp_y + 18)], fill=(15, 23, 42, 255))
draw.ellipse([lamp_x - 4, lamp_y + 1, lamp_x + 4, lamp_y + 7], fill=(56, 189, 248, 255)) # Glowing cyan core

# 7. Magic Sparkles & Stars around Aladdin
stars = [(120, 150), (140, 100), (370, 110), (395, 160), (360, 260), (110, 240)]
for sx, sy in stars:
    draw.polygon([(sx, sy - 12), (sx + 3, sy - 3), (sx + 12, sy), (sx + 3, sy + 3), (sx, sy + 12), (sx - 3, sy + 3), (sx - 12, sy), (sx - 3, sy - 3)], fill=(253, 224, 71, 255))
    draw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=(255, 255, 255, 255))

# 8. Bottom Banner: "ALAVUDDIN VAULT"
banner_y = 420
# Banner ribbon wings
draw.polygon([(40, banner_y + 20), (80, banner_y), (80, banner_y + 40), (40, banner_y + 50)], fill=(67, 56, 202, 255))
draw.polygon([(472, banner_y + 20), (432, banner_y), (432, banner_y + 40), (472, banner_y + 50)], fill=(67, 56, 202, 255))

# Main Banner Body
draw.rounded_rectangle([70, banner_y - 12, 442, banner_y + 48], radius=16, fill=(79, 70, 229, 255), outline=(245, 158, 11, 255), width=3)

# Text on Banner
try:
    font = ImageFont.truetype("arialbd.ttf", 26)
    subfont = ImageFont.truetype("arialbd.ttf", 14)
except:
    font = ImageFont.load_default()
    subfont = ImageFont.load_default()

text = "ALAVUDDIN VAULT"
subtext = "🔒 AES-256 ENCRYPTED"

# Draw text centered
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
draw.text(((SIZE - tw) / 2, banner_y - 4), text, fill=(255, 255, 255, 255), font=font)

bbox2 = draw.textbbox((0, 0), subtext, font=subfont)
tw2 = bbox2[2] - bbox2[0]
draw.text(((SIZE - tw2) / 2, banner_y + 24), subtext, fill=(253, 224, 71, 255), font=subfont)

# Save images
img.save("D:/keyvault-app/assets/logo.png", "PNG")
img.save("D:/keyvault-app/assets/icon.png", "PNG")
img.save("D:/keyvault-app/assets/adaptive-icon.png", "PNG")

print("Alavuddin Vault Logo generated successfully!")
