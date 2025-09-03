#!/usr/bin/env python3
"""
Halloween Item Generator

This script generates Halloween-themed items with:
- Descriptive name and category
- Gemini Flash-generated image
- Estimated cost in USD
- Storage in Firestore database
"""

import os
import base64
import time
import random
import uuid
from io import BytesIO
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

import requests
import base64
import mimetypes
from google import genai
from google.genai import types
from PIL import Image, ImageDraw
from rembg import remove as remove_bg
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables. Will use placeholder images instead.")
# No need to configure with new client approach

# Initialize Firebase with hardcoded service account path
FIREBASE_SERVICE_ACCOUNT_PATH = '/Users/thebilly/3 Resources/dev secrets/codetv-andrew-billy-firebase-adminsdk-fbsvc-9c29734d52.json'
cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred, {
    'storageBucket': 'codetv-andrew-billy.firebasestorage.app'
})
db = firestore.client()
bucket = storage.bucket()

# Constants
OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

# Import the Halloween items dataset from separate file
from halloween_items import HALLOWEEN_ITEMS

def generate_halloween_image(category: str, item_id: str) -> Path:
    """
    Generate a placeholder Halloween image for the given category.
    This is used when Gemini image generation fails.
    
    Args:
        category: Item category (costume, candy, mask, witchy)
        item_id: Unique identifier for the item
        
    Returns:
        Path to the generated placeholder image
    """
    # Define colors for different categories
    category_colors = {
        "costume": (100, 50, 200),     # Purple
        "candy": (255, 100, 100),      # Pink/Red
        "mask": (50, 150, 50),         # Green
        "witchy": (50, 50, 100),       # Dark Blue
        "decoration": (200, 120, 50)   # Orange
    }
    
    # Use a default color if category not found
    color = category_colors.get(category, (150, 150, 150))
    
    # Create a simple colored image with text
    img_size = (400, 400)
    img = Image.new('RGB', img_size, color)
    
    # Add some Halloween-themed patterns
    draw = ImageDraw.Draw(img)
    
    # Draw a simple pattern based on category
    if category == "mask" or category == "costume":
        # Draw eyes
        eye_size = 40
        draw.ellipse((100-eye_size//2, 150-eye_size//2, 100+eye_size//2, 150+eye_size//2), fill=(255, 165, 0))
        draw.ellipse((300-eye_size//2, 150-eye_size//2, 300+eye_size//2, 150+eye_size//2), fill=(255, 165, 0))
        
        # Draw mouth
        draw.arc((150, 200, 250, 300), 0, 180, fill=(255, 165, 0), width=10)
    
    elif category == "candy":
        # Draw candy pattern
        for i in range(10):
            x = random.randint(0, img_size[0])
            y = random.randint(0, img_size[1])
            size = random.randint(10, 30)
            draw.ellipse((x-size, y-size, x+size, y+size), fill=(255, 255, 255))
    
    elif category == "decoration":
        # Draw a spooky house silhouette
        # House body
        draw.rectangle((100, 150, 300, 300), fill=(30, 30, 30))
        # Roof
        draw.polygon([(100, 150), (300, 150), (200, 100)], fill=(60, 60, 60))
        # Windows
        draw.rectangle((130, 180, 170, 220), fill=(255, 255, 0))
        draw.rectangle((230, 180, 270, 220), fill=(255, 255, 0))
        # Door
        draw.rectangle((180, 230, 220, 300), fill=(90, 60, 30))
    
    else:  # witchy
        # Draw stars/magical pattern
        for i in range(15):
            x = random.randint(0, img_size[0])
            y = random.randint(0, img_size[1])
            size = random.randint(2, 8)
            draw.ellipse((x-size, y-size, x+size, y+size), fill=(255, 255, 100))
    
    # Save the image
    output_path = OUTPUT_DIR / f"{category}_{item_id}.png"
    img.save(output_path)
    
    return output_path

def generate_image_with_gemini(prompt: str, category: str, item_id: str) -> Tuple[str, Path]:
    """
    Generate an image using Gemini Flash and save it to the specified path.
    If Gemini fails, generate a placeholder image instead.
    
    Args:
        prompt: The description for image generation
        category: The item category
        item_id: Unique identifier for the item
        
    Returns:
        Tuple of (image_url, local_file_path)
    """
    output_path = OUTPUT_DIR / f"{category}_{item_id}.png"
    
    # Check if API key is available
    if not GOOGLE_API_KEY:
        print(f"Generating placeholder image for: {prompt} (no API key provided)")
        placeholder_path = generate_halloween_image(category, item_id)
        return "placeholder_generated", placeholder_path
    
    # Enhanced prompt for better results with solid background for easy removal
    enhanced_prompt = f"Create a high-quality, detailed product image for Halloween: {prompt}. " \
                     f"The image should be well-lit, centered, with a SOLID WHITE BACKGROUND. " \
                     f"IMPORTANT: Make sure the item is clearly separated from the white background " \
                     f"with good contrast and no shadows. The item should be the main focus and take up most of the frame. " \
                     f"This is for an e-commerce website product display."
    
    try:
        # Initialize the Gemini client
        client = genai.Client(api_key=GOOGLE_API_KEY)
        
        print(f"Generating Gemini image for: {enhanced_prompt}")
        
        # Configure the model and request
        model = "gemini-2.5-flash-image-preview"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=enhanced_prompt),
                ],
            ),
        ]
        generate_content_config = types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        )
        
        # Track if we've received an image
        image_received = False
        
        # Stream the response
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if (
                chunk.candidates is None
                or chunk.candidates[0].content is None
                or chunk.candidates[0].content.parts is None
            ):
                continue
                
            # Check for image data
            if (
                chunk.candidates[0].content.parts[0].inline_data 
                and chunk.candidates[0].content.parts[0].inline_data.data
            ):
                # Get the image data
                inline_data = chunk.candidates[0].content.parts[0].inline_data
                data_buffer = inline_data.data
                file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
                
                # Save the image
                output_path = OUTPUT_DIR / f"{category}_{item_id}{file_extension}"
                with open(output_path, "wb") as f:
                    f.write(data_buffer)
                
                print(f"Generated image saved to {output_path}")
                image_received = True
                
            # If text is returned
            elif hasattr(chunk, 'text') and chunk.text:
                print(f"Text response from Gemini: {chunk.text[:100]}...")
        
        # Check if we received an image
        if not image_received:
            print("No image was returned from Gemini, using placeholder")
            placeholder_path = generate_halloween_image(category, item_id)
            return "placeholder_generated", placeholder_path
            
        return "gemini_generated", output_path
        
    except Exception as e:
        print(f"Error generating image with Gemini: {e}")
        # Fall back to placeholder in case of any errors
        placeholder_path = generate_halloween_image(category, item_id)
        return "placeholder_generated", placeholder_path

def generate_price(min_price: float, max_price: float) -> float:
    """Generate a random price within the given range."""
    return round(random.uniform(min_price, max_price), 2)

def remove_background_and_resize(input_path: Path, size: Tuple[int, int] = (100, 100)) -> Path:
    """
    Remove the background from an image and resize it to the specified dimensions.
    
    Args:
        input_path: Path to the input image
        size: Target size (width, height) in pixels
        
    Returns:
        Path to the processed image with transparent background
    """
    try:
        # Load the input image
        input_img = Image.open(input_path)
        
        # Remove the background
        output_img = remove_bg(input_img)
        
        # Resize the image while maintaining aspect ratio
        output_img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Create a new image with exact dimensions and paste the resized image centered
        final_img = Image.new("RGBA", size, (0, 0, 0, 0))
        paste_position = ((size[0] - output_img.width) // 2, 
                          (size[1] - output_img.height) // 2)
        final_img.paste(output_img, paste_position, output_img)
        
        # Create the output path
        output_path = input_path.parent / f"{input_path.stem}_icon{input_path.suffix}"
        
        # Save the result
        final_img.save(output_path, format="PNG")
        print(f"Background removed, resized to {size}px, and saved to {output_path}")
        
        return output_path
    
    except Exception as e:
        print(f"Error processing image: {e}")
        return input_path  # Return the original image if processing fails

def upload_to_storage(local_image_path: Path, item_id: str, category: str) -> str:
    """
    Upload an image to Firebase Storage.
    
    Args:
        local_image_path: Path to the local image file
        item_id: Unique ID for the item
        category: Item category (for organizing in storage)
        
    Returns:
        Public URL for the uploaded image
    """
    try:
        # Simple filename for storage (in the top-level bucket)
        storage_path = f"{os.path.basename(local_image_path)}"
        
        # Create a blob and upload the file
        blob = bucket.blob(storage_path)
        blob.upload_from_filename(str(local_image_path))
        
        # Make the blob publicly accessible
        blob.make_public()
        
        # Return the public URL
        return blob.public_url
    
    except Exception as e:
        print(f"Error uploading image to Firebase Storage: {e}")
        return ""

def save_to_firestore(item_data: Dict[str, Any]) -> str:
    """
    Save the item to Firestore database.
    
    Args:
        item_data: Dictionary containing item information
        
    Returns:
        Document ID of the saved item
    """
    # Add to 'items' collection
    doc_ref = db.collection('items').document()
    doc_ref.set(item_data)
    
    return doc_ref.id

def process_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single Halloween item by generating image and price.
    
    Args:
        item: Dictionary containing item information
        
    Returns:
        Processed item with image URL and price
    """
    print(f"Processing: {item['name']}")
    
    # Generate a unique ID for the item
    item_id = str(uuid.uuid4())
    
    # Generate the image
    prompt = f"{item['name']} - {item['description']}"
    _, local_path = generate_image_with_gemini(prompt, item['category'], item_id)
    
    # Process the image to remove background and resize to 100x100px
    if os.path.exists(local_path):
        print(f"Removing background and resizing {local_path}")
        icon_path = remove_background_and_resize(local_path, size=(100, 100))
        
        # Upload the processed image with transparent background
        storage_url = upload_to_storage(icon_path, item_id, item['category'])
    else:
        storage_url = "https://via.placeholder.com/400x400?text=Image+Generation+Failed"
    
    # Generate a random price within the specified range
    price = generate_price(item['min_price'], item['max_price'])
    
    # Create the full item data
    processed_item = {
        "id": item_id,
        "name": item['name'],
        "category": item['category'],
        "description": item['description'],
        "price": price,
        "image_url": storage_url,  # Cloud storage URL
        "image_local_path": str(local_path),
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    
    return processed_item

def main():
    """Main function to process all Halloween items."""
    print(f"Starting Halloween item generation for {len(HALLOWEEN_ITEMS)} items")
    
    results = []
    for item in HALLOWEEN_ITEMS:
        try:
            # Process the item
            processed_item = process_item(item)
            
            # Save to Firestore
            doc_id = save_to_firestore(processed_item)
            processed_item['firestore_id'] = doc_id
            
            results.append(processed_item)
            print(f"Successfully processed and saved: {processed_item['name']}")
            
            # Add a small delay to avoid hitting API rate limits
            time.sleep(2)
            
        except Exception as e:
            print(f"Error processing item {item['name']}: {e}")
    
    # Save the results to a JSON file for reference
    results_file = OUTPUT_DIR / "processed_items.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"Completed processing {len(results)} items")
    print(f"Results saved to {results_file}")

if __name__ == "__main__":
    main()
