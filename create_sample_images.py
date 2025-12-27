#!/usr/bin/env python3
"""
GlamAI - Create Sample Images for Static Folders
This script creates placeholder images for development/testing
"""

from PIL import Image, ImageDraw, ImageFont
import os
from pathlib import Path
from datetime import datetime
import uuid


def create_placeholder_image(width, height, text, color, output_path):
    """Create a placeholder image with text"""
    # Create image with background color
    img = Image.new('RGB', (width, height), color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 40)
            small_font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
    
    # Draw text in center
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    text_x = (width - text_width) // 2
    text_y = (height - text_height) // 2
    
    # Draw white rectangle behind text for contrast
    padding = 20
    draw.rectangle([
        text_x - padding, 
        text_y - padding,
        text_x + text_width + padding,
        text_y + text_height + padding
    ], fill='white', outline='black', width=3)
    
    # Draw main text
    draw.text((text_x, text_y), text, fill='black', font=font)
    
    # Draw subtitle
    subtitle = f"{width}x{height}"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=small_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    subtitle_y = text_y + text_height + 10
    
    draw.text((subtitle_x, subtitle_y), subtitle, fill='white', font=small_font)
    
    # Save image
    img.save(output_path, 'JPEG', quality=85)
    print(f"✅ Created: {output_path}")


def create_sample_files():
    """Create sample images in all static directories"""
    
    print("🎨 Creating sample placeholder images...")
    print("=" * 50)
    
    # Ensure directories exist
    base_path = Path("static")
    directories = {
        "uploads": "#3498db",      # Blue
        "temp": "#95a5a6",         # Gray
        "faces": "#e74c3c",        # Red
        "outfits": "#9b59b6",      # Purple
        "accessories": "#f39c12",  # Orange
        "makeup_results": "#2ecc71" # Green
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for directory, color in directories.items():
        dir_path = base_path / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        
        print(f"\n📁 Creating samples in {directory}/")
        
        if directory == "uploads":
            # Create temporary upload samples
            for i in range(3):
                filename = f"temp_upload_{i+1}_{uuid.uuid4().hex[:8]}.jpg"
                create_placeholder_image(
                    800, 600,
                    f"UPLOAD {i+1}\nTEMP FILE",
                    color,
                    dir_path / filename
                )
        
        elif directory == "temp":
            # Create processing temp files
            for i in range(2):
                filename = f"process_{uuid.uuid4().hex[:8]}.jpg"
                create_placeholder_image(
                    600, 400,
                    f"TEMP\nPROCESSING",
                    color,
                    dir_path / filename
                )
        
        elif directory == "faces":
            # Create sample face images for different users
            for user_id in [101, 102, 103]:
                filename = f"user_{user_id}_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
                create_placeholder_image(
                    800, 800,
                    f"FACE\nUser {user_id}",
                    color,
                    dir_path / filename
                )
        
        elif directory == "outfits":
            # Create sample outfit images
            for session_id in [1, 2, 3]:
                filename = f"user_101_session_{session_id}_{timestamp}.jpg"
                create_placeholder_image(
                    1200, 900,
                    f"OUTFIT\nSession {session_id}",
                    color,
                    dir_path / filename
                )
        
        elif directory == "accessories":
            # Create sample accessory images
            for session_id in [1, 2]:
                filename = f"user_101_session_{session_id}_{timestamp}.jpg"
                create_placeholder_image(
                    1000, 800,
                    f"ACCESSORIES\nSession {session_id}",
                    color,
                    dir_path / filename
                )
        
        elif directory == "makeup_results":
            # Create sample final result images
            for session_id in [1, 2, 3, 4]:
                filename = f"user_101_session_{session_id}_final_{timestamp}.jpg"
                create_placeholder_image(
                    1200, 1200,
                    f"FINAL LOOK\nSession {session_id}",
                    color,
                    dir_path / filename
                )
    
    print("\n" + "=" * 50)
    print("✅ All sample images created successfully!")
    print("\n📊 Summary:")
    print(f"   - uploads: 3 files")
    print(f"   - temp: 2 files")
    print(f"   - faces: 3 files (3 users)")
    print(f"   - outfits: 3 files")
    print(f"   - accessories: 2 files")
    print(f"   - makeup_results: 4 files")
    print(f"\n   Total: 17 sample images")
    print("\n💡 Note: These are placeholder images for development.")
    print("   Real user images will replace these during actual usage.")


def create_gitkeep_files():
    """Create .gitkeep files to track empty directories"""
    base_path = Path("static")
    directories = ["uploads", "temp", "faces", "outfits", "accessories", "makeup_results"]
    
    print("\n📝 Creating .gitkeep files...")
    for directory in directories:
        gitkeep_path = base_path / directory / ".gitkeep"
        gitkeep_path.parent.mkdir(parents=True, exist_ok=True)
        gitkeep_path.touch()
        print(f"   ✅ {gitkeep_path}")


def create_static_gitignore():
    """Create .gitignore for static folder"""
    gitignore_content = """# Ignore all image files
*.jpg
*.jpeg
*.png
*.gif
*.webp
*.bmp
*.tiff

# Ignore video files
*.mp4
*.mov
*.avi
*.mkv

# But keep structure files
!.gitkeep
!README.md
!.gitignore

# Sample/placeholder images are ok to commit
!sample_*.jpg
!placeholder_*.jpg
"""
    
    gitignore_path = Path("static/.gitignore")
    gitignore_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(gitignore_path, 'w') as f:
        f.write(gitignore_content)
    
    print(f"\n✅ Created: static/.gitignore")


def show_directory_tree():
    """Show the created directory structure"""
    print("\n📂 Static Directory Structure:")
    print("=" * 50)
    
    base_path = Path("static")
    
    for directory in sorted(base_path.iterdir()):
        if directory.is_dir():
            files = list(directory.glob("*"))
            file_count = len([f for f in files if f.is_file() and f.suffix in ['.jpg', '.jpeg', '.png']])
            
            print(f"\n{directory.name}/ ({file_count} images)")
            
            for file in sorted(files)[:5]:  # Show first 5 files
                if file.is_file():
                    size_kb = file.stat().st_size / 1024
                    print(f"   ├── {file.name} ({size_kb:.1f} KB)")
            
            if len(files) > 5:
                print(f"   └── ... and {len(files) - 5} more files")


if __name__ == "__main__":
    try:
        print("\n💄 GlamAI - Static Files Setup")
        print("=" * 50)
        
        # Check if PIL is available
        try:
            from PIL import Image
        except ImportError:
            print("\n❌ Error: Pillow (PIL) is not installed!")
            print("Install it with: pip install Pillow")
            exit(1)
        
        # Create sample images
        create_sample_files()
        
        # Create .gitkeep files
        create_gitkeep_files()
        
        # Create .gitignore
        create_static_gitignore()
        
        # Show tree
        show_directory_tree()
        
        print("\n" + "=" * 50)
        print("✅ Setup complete!")
        print("\n💡 Next steps:")
        print("   1. These are placeholder images for development")
        print("   2. Real user uploads will replace them")
        print("   3. Run 'python cleanup_files.py' to test cleanup")
        print("   4. In production, use Azure Blob Storage instead")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)